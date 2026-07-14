<?php

namespace App\Domain\Communities\Events;

use App\Domain\Communities\Enums\TipoSolicitud;
use App\Models\SolicitudMembresia;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cuando alguien envía una solicitud, para que quien debe
 * revisarla la vea aparecer al instante:
 * - "crear" → canal de administradores (panel de gestión de comunidades).
 * - "unirse" → canal personal del líder de esa comunidad.
 */
class SolicitudRecibida implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly SolicitudMembresia $solicitud,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        if ($this->solicitud->tipo === TipoSolicitud::Crear) {
            return new PrivateChannel('admin.solicitudes');
        }

        $liderId = $this->solicitud->comunidad?->lider_id;

        return new PrivateChannel("App.Models.User.{$liderId}");
    }

    public function broadcastAs(): string
    {
        return 'solicitud.recibida';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'solicitud_id' => $this->solicitud->id,
            'tipo' => $this->solicitud->tipo->value,
            'comunidad_id' => $this->solicitud->comunidad_id,
        ];
    }
}
