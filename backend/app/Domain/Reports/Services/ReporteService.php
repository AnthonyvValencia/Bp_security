<?php

namespace App\Domain\Reports\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Reports\DTOs\CrearReporteData;
use App\Domain\Reports\Enums\EstadoReporte;
use App\Domain\Reports\Events\ReporteActualizado;
use App\Domain\Reports\Exceptions\ReglaReporteException;
use App\Models\Comunidad;
use App\Models\Reporte;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ReporteService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    public function crear(User $usuario, CrearReporteData $datos): Reporte
    {
        $comunidadId = $usuario->membresiaActiva()->value('comunidad_id');

        if (! $comunidadId) {
            throw new ReglaReporteException('Debes pertenecer a una comunidad activa para reportar un incidente.');
        }

        if (Comunidad::find($comunidadId)?->estaSuspendida()) {
            throw new ReglaReporteException('La comunidad se encuentra suspendida.');
        }

        $reporte = Reporte::create([
            'usuario_id' => $usuario->id,
            'comunidad_id' => $comunidadId,
            'titulo' => $datos->titulo,
            'descripcion' => $datos->descripcion,
            'categoria' => $datos->categoria,
            'latitud' => $datos->latitud,
            'longitud' => $datos->longitud,
            'estado' => EstadoReporte::Abierto,
        ]);

        $this->auditor->registrar('reporte_creado', usuario: $usuario, entidadTipo: Reporte::class, entidadId: $reporte->id);

        ReporteActualizado::dispatch($reporte);

        return $reporte;
    }

    public function cambiarEstado(Reporte $reporte, User $lider, EstadoReporte $nuevoEstado, ?string $comentario): Reporte
    {
        if ($reporte->estado === $nuevoEstado) {
            throw new ReglaReporteException('El reporte ya se encuentra en ese estado.');
        }

        $reporte = DB::transaction(function () use ($reporte, $lider, $nuevoEstado, $comentario) {
            $reporte->historialEstados()->create([
                'estado_anterior' => $reporte->estado,
                'estado_nuevo' => $nuevoEstado,
                'cambiado_por' => $lider->id,
                'comentario' => $comentario,
            ]);

            $reporte->update(['estado' => $nuevoEstado]);

            $this->auditor->registrar('reporte_cambio_estado', usuario: $lider, entidadTipo: Reporte::class, entidadId: $reporte->id, metadatos: [
                'estado_nuevo' => $nuevoEstado->value,
            ]);

            return $reporte;
        });

        // Después del commit: si la transacción falla, no se emite el evento.
        ReporteActualizado::dispatch($reporte);

        return $reporte;
    }

    /**
     * El propio autor elimina su reporte (limpieza de su historial). Se
     * permite en cualquier estado: para entonces el líder ya vio lo que
     * necesitaba, y el objetivo es justamente que no se acumulen.
     */
    public function eliminar(Reporte $reporte, User $usuario): void
    {
        $reporte->delete();

        $this->auditor->registrar('reporte_eliminado', usuario: $usuario, entidadTipo: Reporte::class, entidadId: $reporte->id);
    }

    /**
     * @return Collection<int, Reporte>
     */
    public function listarPropios(User $usuario): Collection
    {
        return Reporte::query()
            ->where('usuario_id', $usuario->id)
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @return Collection<int, Reporte>
     */
    public function listarPorComunidad(Comunidad $comunidad): Collection
    {
        return Reporte::query()
            ->where('comunidad_id', $comunidad->id)
            ->with('usuario')
            ->orderByDesc('created_at')
            ->get();
    }
}
