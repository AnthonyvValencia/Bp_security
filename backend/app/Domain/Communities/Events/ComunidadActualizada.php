<?php

namespace App\Domain\Communities\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cuando el admin suspende, reactiva o elimina una comunidad,
 * para que los miembros conectados reaccionen al instante (sin reabrir la
 * app). El payload es plano (id + estado) y no un Resource: en el caso
 * "eliminada" el modelo ya no existe para quien recibe el evento.
 */
class ComunidadActualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $comunidadId,
        public readonly string $estado,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("comunidad.{$this->comunidadId}");
    }

    public function broadcastAs(): string
    {
        return 'comunidad.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'comunidad_id' => $this->comunidadId,
            'estado' => $this->estado,
        ];
    }
}
