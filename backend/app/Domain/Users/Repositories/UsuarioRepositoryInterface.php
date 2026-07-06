<?php

namespace App\Domain\Users\Repositories;

use App\Models\User;

interface UsuarioRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $datos
     */
    public function actualizar(User $usuario, array $datos): User;
}
