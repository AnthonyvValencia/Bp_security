<?php

namespace App\Domain\Panic\Events;

use App\Http\Resources\AlertaPanicoResource;
use App\Models\AlertaPanico;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara al activar, cancelar o cambiar el estado de una alerta de
 * pánico. Usa ShouldBroadcastNow (no se encola) porque este es el canal
 * más crítico de la app en cuanto a latencia — no depende de un worker
 * de colas corriendo aparte.
 */
class AlertaPanicoActualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly AlertaPanico $alerta,
    ) {
        $this->alerta->loadMissing('usuario');
    }

    /**
     * Se emite al canal de la comunidad (para el líder) y al canal privado
     * del propio emisor (para que su historial personal se actualice al
     * instante, sin depender de polling ni de la sincronización offline).
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $canales = [
            new PrivateChannel("App.Models.User.{$this->alerta->usuario_id}"),
        ];

        if ($this->alerta->comunidad_id !== null) {
            $canales[] = new PrivateChannel("comunidad.{$this->alerta->comunidad_id}.alertas-panico");
        }

        return $canales;
    }

    public function broadcastAs(): string
    {
        return 'alerta.actualizada';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'alerta' => (new AlertaPanicoResource($this->alerta))->resolve(),
        ];
    }
}
