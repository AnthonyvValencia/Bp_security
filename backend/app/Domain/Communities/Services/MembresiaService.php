<?php

namespace App\Domain\Communities\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Domain\Communities\Enums\TipoSolicitud;
use App\Domain\Communities\Events\ComunidadActualizada;
use App\Domain\Communities\Events\MembresiaActualizada;
use App\Domain\Communities\Events\SolicitudRecibida;
use App\Domain\Communities\Exceptions\ReglaComunidadException;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\SolicitudMembresia;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class MembresiaService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    public function solicitarIngreso(User $usuario, Comunidad $comunidad): SolicitudMembresia
    {
        if ($comunidad->estado !== EstadoComunidad::Aprobada) {
            throw new ReglaComunidadException('Esta comunidad no está disponible.');
        }

        if ($usuario->membresiaActiva()->exists()) {
            throw new ReglaComunidadException('Ya perteneces a una comunidad activa. Debes salir de ella antes de unirte a otra.');
        }

        $yaTieneSolicitudPendiente = SolicitudMembresia::query()
            ->where('usuario_id', $usuario->id)
            ->where('comunidad_id', $comunidad->id)
            ->where('tipo', TipoSolicitud::Unirse)
            ->where('estado', EstadoSolicitud::Pendiente)
            ->exists();

        if ($yaTieneSolicitudPendiente) {
            throw new ReglaComunidadException('Ya tienes una solicitud pendiente para esta comunidad.');
        }

        $solicitud = SolicitudMembresia::create([
            'usuario_id' => $usuario->id,
            'tipo' => TipoSolicitud::Unirse,
            'comunidad_id' => $comunidad->id,
        ]);

        $this->auditor->registrar('membresia_solicitada', usuario: $usuario, entidadTipo: SolicitudMembresia::class, entidadId: $solicitud->id);

        // El líder ve la solicitud de ingreso aparecer al instante.
        SolicitudRecibida::dispatch($solicitud);

        return $solicitud;
    }

    /**
     * @return Collection<int, SolicitudMembresia>
     */
    public function listarSolicitudesPendientes(Comunidad $comunidad): Collection
    {
        return SolicitudMembresia::query()
            ->where('comunidad_id', $comunidad->id)
            ->where('tipo', TipoSolicitud::Unirse)
            ->where('estado', EstadoSolicitud::Pendiente)
            ->with('usuario')
            ->orderBy('created_at')
            ->get();
    }

    public function aprobarIngreso(SolicitudMembresia $solicitud, User $lider): ComunidadMiembro
    {
        $this->validarSolicitudDeIngresoPendiente($solicitud);

        $miembro = ComunidadMiembro::create([
            'comunidad_id' => $solicitud->comunidad_id,
            'usuario_id' => $solicitud->usuario_id,
            'estado' => EstadoMiembro::Activo,
        ]);

        $solicitud->update([
            'estado' => EstadoSolicitud::Aprobada,
            'revisado_por' => $lider->id,
            'revisado_en' => now(),
        ]);

        $this->auditor->registrar('miembro_aprobado', usuario: $lider, entidadTipo: ComunidadMiembro::class, entidadId: $miembro->id);

        // El nuevo miembro ve su comunidad habilitada al instante, y quienes
        // estén viendo la comunidad ven actualizarse el conteo de miembros.
        MembresiaActualizada::dispatch($solicitud->usuario_id, 'ingreso_aprobado', $solicitud->comunidad_id);
        ComunidadActualizada::dispatch($solicitud->comunidad_id, 'miembros_actualizados');

        return $miembro;
    }

    public function rechazarIngreso(SolicitudMembresia $solicitud, User $lider, ?string $motivo): void
    {
        $this->validarSolicitudDeIngresoPendiente($solicitud);

        $solicitud->update([
            'estado' => EstadoSolicitud::Rechazada,
            'revisado_por' => $lider->id,
            'revisado_en' => now(),
            'motivo' => $motivo,
        ]);

        $this->auditor->registrar('miembro_rechazado', usuario: $lider, entidadTipo: SolicitudMembresia::class, entidadId: $solicitud->id);

        MembresiaActualizada::dispatch($solicitud->usuario_id, 'ingreso_rechazado', $solicitud->comunidad_id);
    }

    /**
     * El ciudadano sale voluntariamente de su comunidad. El líder no puede
     * salir de la comunidad que lidera: primero el admin debe reasignar el
     * liderazgo o eliminar la comunidad.
     */
    public function salir(User $usuario): void
    {
        $membresia = $usuario->membresiaActiva()->first();

        if (! $membresia) {
            throw new ReglaComunidadException('No perteneces a ninguna comunidad activa.');
        }

        if ($usuario->comunidadLiderada?->id === $membresia->comunidad_id) {
            throw new ReglaComunidadException('El líder no puede salir de su comunidad.');
        }

        $membresia->update(['estado' => EstadoMiembro::Retirado]);

        $this->auditor->registrar('miembro_retirado', usuario: $usuario, entidadTipo: ComunidadMiembro::class, entidadId: $membresia->id);

        ComunidadActualizada::dispatch($membresia->comunidad_id, 'miembros_actualizados');
    }

    public function expulsarMiembro(ComunidadMiembro $miembro, User $lider): void
    {
        if ($miembro->estado !== EstadoMiembro::Activo) {
            throw new ReglaComunidadException('Este miembro ya no está activo en la comunidad.');
        }

        $miembro->update(['estado' => EstadoMiembro::Expulsado]);

        $this->auditor->registrar('miembro_expulsado', usuario: $lider, entidadTipo: ComunidadMiembro::class, entidadId: $miembro->id);

        // El expulsado pierde el acceso a la comunidad al instante en su app.
        MembresiaActualizada::dispatch($miembro->usuario_id, 'expulsado', $miembro->comunidad_id);
        ComunidadActualizada::dispatch($miembro->comunidad_id, 'miembros_actualizados');
    }

    /**
     * @return Collection<int, ComunidadMiembro>
     */
    public function listarMiembros(Comunidad $comunidad): Collection
    {
        return ComunidadMiembro::query()
            ->where('comunidad_id', $comunidad->id)
            ->where('estado', EstadoMiembro::Activo)
            ->with('usuario')
            ->get();
    }

    private function validarSolicitudDeIngresoPendiente(SolicitudMembresia $solicitud): void
    {
        if ($solicitud->tipo !== TipoSolicitud::Unirse) {
            throw new ReglaComunidadException('Esta solicitud no es de ingreso a una comunidad.');
        }

        if ($solicitud->estado !== EstadoSolicitud::Pendiente) {
            throw new ReglaComunidadException('Esta solicitud ya fue revisada.');
        }
    }
}
