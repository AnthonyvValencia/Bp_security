<?php

namespace App\Domain\Communities\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cuando cambia la lista pública de comunidades del catálogo
 * (aprobar creación, suspender, reactivar o eliminar): una comunidad
 * aparece o desaparece de "buscar comunidades". El canal es privado pero
 * abierto a cualquier usuario autenticado, porque el catálogo lo ve todo
 * el mundo. El payload es una simple señal para refrescar la lista.
 */
class ComunidadCatalogoActualizado implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('comunidades');
    }

    public function broadcastAs(): string
    {
        return 'comunidad.catalogo';
    }
}
