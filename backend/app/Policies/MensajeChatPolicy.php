<?php

namespace App\Policies;

use App\Models\MensajeChat;
use App\Models\User;

class MensajeChatPolicy
{
    /**
     * Moderar (eliminar): el autor del mensaje o el líder de la comunidad
     * donde se publicó. El admin ya tiene bypass total vía Gate::before.
     */
    public function eliminar(User $usuario, MensajeChat $mensaje): bool
    {
        if ($mensaje->usuario_id === $usuario->id) {
            return true;
        }

        return $usuario->comunidadLiderada?->id === $mensaje->comunidad_id;
    }
}
