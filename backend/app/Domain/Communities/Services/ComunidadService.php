<?php

namespace App\Domain\Communities\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Communities\DTOs\SolicitarCrearComunidadData;
use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Domain\Communities\Enums\TipoSolicitud;
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

        return DB::transaction(function () use ($solicitud, $admin) {
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
