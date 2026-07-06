<?php

namespace App\Policies;

use App\Domain\Communities\Enums\EstadoMiembro;
use App\Models\Comunidad;
use App\Models\User;

class ComunidadPolicy
{
    /**
     * El líder solo gestiona su propia comunidad (aprobar/rechazar miembros,
     * expulsar, editar info). El admin tiene bypass total vía Gate::before.
     */
    public function gestionar(User $usuario, Comunidad $comunidad): bool
    {
        return $comunidad->lider_id === $usuario->id;
    }

    /**
     * Ver miembros: el líder de esa comunidad, o un ciudadano que sea
     * miembro activo de esa misma comunidad. El admin ya tiene bypass total.
     */
    public function verMiembros(User $usuario, Comunidad $comunidad): bool
    {
        if ($comunidad->lider_id === $usuario->id) {
            return true;
        }

        return $comunidad->miembros()
            ->where('usuario_id', $usuario->id)
            ->where('estado', EstadoMiembro::Activo)
            ->exists();
    }
}
