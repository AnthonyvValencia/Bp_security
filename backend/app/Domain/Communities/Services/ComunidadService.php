<?php

namespace App\Domain\Communities\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Communities\DTOs\SolicitarCrearComunidadData;
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
use Illuminate\Support\Facades\DB;

class ComunidadService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    /**
     * @return Collection<int, Comunidad>
     */
    public function buscar(?string $termino): Collection
    {
        return Comunidad::query()
            ->where('estado', EstadoComunidad::Aprobada)
            ->when($termino, fn ($query) => $query->where(function ($query) use ($termino) {
                $query->where('nombre', 'ilike', "%{$termino}%")
                    ->orWhere('barrio', 'ilike', "%{$termino}%");
            }))
            ->orderBy('nombre')
            ->get();
    }

    public function solicitarCreacion(User $usuario, SolicitarCrearComunidadData $datos): SolicitudMembresia
    {
        if ($usuario->membresiaActiva()->exists()) {
            throw new ReglaComunidadException('Ya perteneces a una comunidad activa. Debes salir de ella antes de solicitar crear una nueva.');
        }

        $solicitud = SolicitudMembresia::create([
            'usuario_id' => $usuario->id,
            'tipo' => TipoSolicitud::Crear,
            'nombre_comunidad_propuesto' => $datos->nombre,
            'descripcion_comunidad_propuesta' => $datos->descripcion,
            'barrio_comunidad_propuesto' => $datos->barrio,
        ]);

        $this->auditor->registrar('comunidad_solicitada', usuario: $usuario, entidadTipo: SolicitudMembresia::class, entidadId: $solicitud->id);

        // El panel de gestión del admin ve la solicitud aparecer al instante.
        SolicitudRecibida::dispatch($solicitud);

        return $solicitud;
    }

    /**
     * @return Collection<int, SolicitudMembresia>
     */
    public function listarPendientesAprobacion(): Collection
    {
        return SolicitudMembresia::query()
            ->where('tipo', TipoSolicitud::Crear)
            ->where('estado', EstadoSolicitud::Pendiente)
            ->with('usuario')
            ->orderBy('created_at')
            ->get();
    }

    public function aprobarCreacion(SolicitudMembresia $solicitud, User $admin): Comunidad
    {
        $this->validarSolicitudDeCreacionPendiente($solicitud);

        $comunidad = DB::transaction(function () use ($solicitud, $admin) {
            $comunidad = Comunidad::create([
                'nombre' => $solicitud->nombre_comunidad_propuesto,
                'descripcion' => $solicitud->descripcion_comunidad_propuesta,
                'barrio' => $solicitud->barrio_comunidad_propuesto,
                'lider_id' => $solicitud->usuario_id,
                'estado' => EstadoComunidad::Aprobada,
                'aprobado_por' => $admin->id,
                'aprobado_en' => now(),
            ]);

            ComunidadMiembro::create([
                'comunidad_id' => $comunidad->id,
                'usuario_id' => $solicitud->usuario_id,
                'estado' => EstadoMiembro::Activo,
            ]);

            $solicitud->update([
                'estado' => EstadoSolicitud::Aprobada,
                'comunidad_id' => $comunidad->id,
                'revisado_por' => $admin->id,
                'revisado_en' => now(),
            ]);

            $this->auditor->registrar('comunidad_aprobada', usuario: $admin, entidadTipo: Comunidad::class, entidadId: $comunidad->id);

            return $comunidad;
        });

        // Tras el commit (no dentro): el solicitante —ahora líder— ve su
        // comunidad habilitada al instante, sin reabrir la app.
        MembresiaActualizada::dispatch($solicitud->usuario_id, 'comunidad_aprobada', $comunidad->id);

        return $comunidad;
    }

    public function rechazarCreacion(SolicitudMembresia $solicitud, User $admin, ?string $motivo): void
    {
        $this->validarSolicitudDeCreacionPendiente($solicitud);

        $solicitud->update([
            'estado' => EstadoSolicitud::Rechazada,
            'revisado_por' => $admin->id,
            'revisado_en' => now(),
            'motivo' => $motivo,
        ]);

        $this->auditor->registrar('comunidad_rechazada', usuario: $admin, entidadTipo: SolicitudMembresia::class, entidadId: $solicitud->id);

        MembresiaActualizada::dispatch($solicitud->usuario_id, 'comunidad_rechazada');
    }

    /**
     * Comunidades que el admin puede gestionar: las que ya operan (aprobadas)
     * o están congeladas (suspendidas). Excluye pendientes/rechazadas —
     * esas viven en el flujo de aprobación— y las eliminadas (soft delete).
     *
     * @return Collection<int, Comunidad>
     */
    public function listarGestionables(): Collection
    {
        return Comunidad::query()
            ->whereIn('estado', [EstadoComunidad::Aprobada, EstadoComunidad::Suspendida])
            ->with('lider')
            ->withCount(['miembrosActivos', 'miembrosConectados'])
            ->orderBy('nombre')
            ->get();
    }

    public function suspender(Comunidad $comunidad, User $admin): Comunidad
    {
        if ($comunidad->estado !== EstadoComunidad::Aprobada) {
            throw new ReglaComunidadException('Solo se puede suspender una comunidad activa.');
        }

        $comunidad->update(['estado' => EstadoComunidad::Suspendida]);

        $this->auditor->registrar('comunidad_suspendida', usuario: $admin, entidadTipo: Comunidad::class, entidadId: $comunidad->id);

        ComunidadActualizada::dispatch($comunidad->id, EstadoComunidad::Suspendida->value);

        return $comunidad->fresh(['lider'])->loadCount(['miembrosActivos', 'miembrosConectados']);
    }

    public function reactivar(Comunidad $comunidad, User $admin): Comunidad
    {
        if ($comunidad->estado !== EstadoComunidad::Suspendida) {
            throw new ReglaComunidadException('Solo se puede reactivar una comunidad suspendida.');
        }

        $comunidad->update(['estado' => EstadoComunidad::Aprobada]);

        $this->auditor->registrar('comunidad_reactivada', usuario: $admin, entidadTipo: Comunidad::class, entidadId: $comunidad->id);

        ComunidadActualizada::dispatch($comunidad->id, EstadoComunidad::Aprobada->value);

        return $comunidad->fresh(['lider'])->loadCount(['miembrosActivos', 'miembrosConectados']);
    }

    public function eliminar(Comunidad $comunidad, User $admin): void
    {
        $this->auditor->registrar('comunidad_eliminada', usuario: $admin, entidadTipo: Comunidad::class, entidadId: $comunidad->id);

        $comunidad->delete();

        // Tras el soft delete: los clientes ya suscritos reciben el aviso y
        // sueltan la comunidad al instante (la autorización del canal ocurrió
        // al suscribirse, no se re-evalúa aquí).
        ComunidadActualizada::dispatch($comunidad->id, 'eliminada');
    }

    public function cambiarLider(Comunidad $comunidad, int $nuevoLiderId, User $admin): Comunidad
    {
        if ($comunidad->lider_id === $nuevoLiderId) {
            throw new ReglaComunidadException('El usuario ya es líder de esta comunidad.');
        }

        $esMiembroActivo = $comunidad->miembros()
            ->where('usuario_id', $nuevoLiderId)
            ->where('estado', EstadoMiembro::Activo)
            ->exists();

        if (! $esMiembroActivo) {
            throw new ReglaComunidadException('El nuevo líder debe ser un miembro activo de la comunidad.');
        }

        // El líder saliente conserva su membresía activa: solo pierde el rol,
        // pasa a ser un vecino más de la comunidad.
        $comunidad->update(['lider_id' => $nuevoLiderId]);

        $this->auditor->registrar('lider_cambiado', usuario: $admin, entidadTipo: Comunidad::class, entidadId: $comunidad->id);

        // Ambos —saliente y entrante— están suscritos al canal de la comunidad
        // (es su comunidad activa), así que refrescan permisos al instante.
        ComunidadActualizada::dispatch($comunidad->id, 'miembros_actualizados');

        return $comunidad->fresh(['lider'])->loadCount(['miembrosActivos', 'miembrosConectados']);
    }

    private function validarSolicitudDeCreacionPendiente(SolicitudMembresia $solicitud): void
    {
        if ($solicitud->tipo !== TipoSolicitud::Crear) {
            throw new ReglaComunidadException('Esta solicitud no es de creación de comunidad.');
        }

        if ($solicitud->estado !== EstadoSolicitud::Pendiente) {
            throw new ReglaComunidadException('Esta solicitud ya fue revisada.');
        }
    }
}
