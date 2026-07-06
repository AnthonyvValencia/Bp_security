<?php

namespace App\Domain\Users\Repositories;

use App\Models\User;

class EloquentUsuarioRepository implements UsuarioRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $datos
     */
    public function actualizar(User $usuario, array $datos): User
    {
        $usuario->update($datos);

        return $usuario->fresh();
    }
}
