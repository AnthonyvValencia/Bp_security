<?php

namespace App\Domain\Reports\Events;

use App\Http\Resources\ReporteResource;
use App\Models\Reporte;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara al crear un reporte o cambiar su estado. Broadcast inmediato
 * (ShouldBroadcastNow) al canal de la comunidad, para que la vista del líder
 * y el muro de incidencias se actualicen sin esperar al polling.
 */
class ReporteActualizado implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Reporte $reporte,
    ) {
        $this->reporte->loadMissing('usuario');
    }

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("comunidad.{$this->reporte->comunidad_id}.reportes"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reporte.actualizado';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'reporte' => (new ReporteResource($this->reporte))->resolve(),
        ];
    }
}
