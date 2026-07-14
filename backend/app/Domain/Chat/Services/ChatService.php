<?php

namespace App\Domain\Chat\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Chat\Events\MensajeChatEnviado;
use App\Domain\Chat\Exceptions\ReglaChatException;
use App\Models\Comunidad;
use App\Models\MensajeChat;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class ChatService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    public function enviar(User $usuario, Comunidad $comunidad, string $contenido): MensajeChat
    {
        $comunidadId = $usuario->membresiaActiva()->value('comunidad_id');

        if ($comunidadId !== $comunidad->id) {
            throw new ReglaChatException('Solo puedes escribir en el chat de tu comunidad activa.');
        }

        if ($comunidad->estaSuspendida()) {
            throw new ReglaChatException('La comunidad se encuentra suspendida.');
        }

        $mensaje = MensajeChat::create([
            'comunidad_id' => $comunidad->id,
            'usuario_id' => $usuario->id,
            'contenido' => $contenido,
        ]);

        MensajeChatEnviado::dispatch($mensaje);

        return $mensaje;
    }

    /**
     * Historial reciente en orden cronológico (más antiguos primero) para
     * pintar el chat de arriba hacia abajo. Se limita para no traer años de
     * conversación de una sola vez.
     *
     * @return Collection<int, MensajeChat>
     */
    public function listar(Comunidad $comunidad, int $limite = 100): Collection
    {
        return MensajeChat::query()
            ->where('comunidad_id', $comunidad->id)
            ->with('usuario')
            ->latest('created_at')
            ->limit($limite)
            ->get()
            ->sortBy('created_at')
            ->values();
    }

    /**
     * Moderación: el líder oculta un mensaje (soft delete). El registro se
     * conserva en la base para auditoría.
     */
    public function eliminar(MensajeChat $mensaje, User $moderador): void
    {
        $mensaje->delete();

        $this->auditor->registrar('mensaje_chat_eliminado', usuario: $moderador, entidadTipo: MensajeChat::class, entidadId: $mensaje->id);
    }
}
