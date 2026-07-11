<?php

namespace App\Domain\Chat\Events;

use App\Http\Resources\MensajeChatResource;
use App\Models\MensajeChat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara al publicarse un mensaje nuevo en el chat de una comunidad.
 * Usa ShouldBroadcastNow (no se encola) para entrega inmediata, igual que
 * las alertas — no depende de un worker de colas corriendo aparte.
 */
class MensajeChatEnviado implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly MensajeChat $mensaje,
    ) {
        $this->mensaje->loadMissing('usuario');
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("comunidad.{$this->mensaje->comunidad_id}.chat"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'mensaje.enviado';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'mensaje' => (new MensajeChatResource($this->mensaje))->resolve(),
        ];
    }
}
