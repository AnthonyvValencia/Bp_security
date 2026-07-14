<?php

namespace App\Domain\Audit\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Señal de que algo cambió en lo que muestra el panel del administrador
 * (métricas de usuarios/comunidades/actividad y feed de auditoría).
 *
 * Se emite desde el Auditor, que es el punto por el que ya pasan todas las
 * acciones sensibles del sistema (registro, login, alertas, reportes,
 * comunidades, membresías, suspensiones, cambios de rol). Así el panel se
 * mantiene en vivo con un solo evento, en vez de uno por cada caso.
 *
 * El payload va vacío a propósito: es un "refresca", no un delta. El panel
 * vuelve a pedir el resumen, que el servidor arma y agrega.
 */
class PanelAdminActualizado implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('admin.panel');
    }

    public function broadcastAs(): string
    {
        return 'admin.panel.actualizado';
    }
}
