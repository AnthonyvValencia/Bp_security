<?php

namespace App\Domain\Communities\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cuando la membresía de un usuario cambia por acción de un
 * tercero (el admin aprueba/rechaza su comunidad, el líder aprueba/rechaza
 * su ingreso, o lo expulsa). Va al canal personal del afectado para que su
 * app reaccione al instante — sin este evento, la comunidad recién aprobada
 * no aparecería hasta reabrir la app.
 */
class MembresiaActualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $usuarioId,
        public readonly string $evento,
        public readonly ?int $comunidadId = null,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("App.Models.User.{$this->usuarioId}");
    }

    public function broadcastAs(): string
    {
        return 'membresia.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'evento' => $this->evento,
            'comunidad_id' => $this->comunidadId,
        ];
    }
}
