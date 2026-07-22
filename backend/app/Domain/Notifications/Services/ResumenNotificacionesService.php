<?php

namespace App\Domain\Notifications\Services;

use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Domain\Communities\Enums\TipoSolicitud;
use App\Domain\Panic\Enums\EstadoAlerta;
use App\Domain\Reports\Enums\EstadoReporte;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\MensajeChat;
use App\Models\Reporte;
use App\Models\SolicitudMembresia;
use App\Models\User;

/**
 * Contadores de "pendientes" que el home pinta como insignias rojas.
 *
 * Todo lo que requiere gestión (solicitudes, alertas, reportes) solo aplica al
 * líder de la comunidad; el chat sin leer aplica a cualquier miembro activo.
 * El liderazgo se deriva de `comunidades.lider_id`, igual que las Policies —
 * no del campo `rol`.
 */
class ResumenNotificacionesService
{
    /**
     * @return array{solicitudes_ingreso: int, alertas_abiertas: int, reportes_abiertos: int, chat_no_leidos: int}
     */
    public function paraUsuario(User $usuario): array
    {
        $membresia = $usuario->membresiaActiva()->first();
        $comunidadId = $membresia?->comunidad_id;

        // Sin comunidad no hay nada que notificar.
        if ($comunidadId === null) {
            return $this->vacio();
        }

        $esLider = Comunidad::where('id', $comunidadId)
            ->where('lider_id', $usuario->id)
            ->exists();

        return [
            'solicitudes_ingreso' => $esLider ? $this->solicitudesIngreso($comunidadId) : 0,
            'alertas_abiertas' => $esLider ? $this->alertasAbiertas($comunidadId) : 0,
            'reportes_abiertos' => $esLider ? $this->reportesAbiertos($comunidadId) : 0,
            'chat_no_leidos' => $this->chatNoLeidos($usuario, $membresia),
        ];
    }

    /**
     * Deja el chat como leído hasta el último mensaje existente. Se guarda el
     * id (no la hora) para que no dependa de la precisión del reloj.
     */
    public function marcarChatLeido(User $usuario, Comunidad $comunidad): void
    {
        $ultimoMensajeId = MensajeChat::where('comunidad_id', $comunidad->id)->max('id');

        $usuario->membresiaActiva()
            ->where('comunidad_id', $comunidad->id)
            ->update(['chat_leido_id' => $ultimoMensajeId]);
    }

    private function solicitudesIngreso(int $comunidadId): int
    {
        return SolicitudMembresia::query()
            ->where('comunidad_id', $comunidadId)
            ->where('tipo', TipoSolicitud::Unirse)
            ->where('estado', EstadoSolicitud::Pendiente)
            ->count();
    }

    private function alertasAbiertas(int $comunidadId): int
    {
        return AlertaPanico::query()
            ->where('comunidad_id', $comunidadId)
            ->whereIn('estado', [EstadoAlerta::Enviada, EstadoAlerta::Reconocida])
            ->count();
    }

    private function reportesAbiertos(int $comunidadId): int
    {
        return Reporte::query()
            ->where('comunidad_id', $comunidadId)
            ->whereIn('estado', [EstadoReporte::Abierto, EstadoReporte::EnRevision])
            ->count();
    }

    /**
     * Mensajes ajenos posteriores al último leído. Los propios nunca cuentan:
     * uno no se notifica a sí mismo. El corte es por id —secuencial y exacto—
     * para no perder mensajes nacidos en el mismo segundo que la lectura.
     */
    private function chatNoLeidos(User $usuario, ComunidadMiembro $membresia): int
    {
        return MensajeChat::query()
            ->where('comunidad_id', $membresia->comunidad_id)
            ->where('usuario_id', '!=', $usuario->id)
            ->when(
                $membresia->chat_leido_id,
                fn ($query) => $query->where('id', '>', $membresia->chat_leido_id),
            )
            ->count();
    }

    /**
     * @return array{solicitudes_ingreso: int, alertas_abiertas: int, reportes_abiertos: int, chat_no_leidos: int}
     */
    private function vacio(): array
    {
        return [
            'solicitudes_ingreso' => 0,
            'alertas_abiertas' => 0,
            'reportes_abiertos' => 0,
            'chat_no_leidos' => 0,
        ];
    }
}
