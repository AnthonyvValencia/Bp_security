<?php

namespace App\Domain\Users\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Users\DTOs\ActualizarPerfilData;
use App\Domain\Users\Repositories\UsuarioRepositoryInterface;
use App\Models\User;

class PerfilService
{
    public function __construct(
        private readonly UsuarioRepositoryInterface $usuarios,
        private readonly Auditor $auditor,
    ) {}

    public function actualizar(User $usuario, ActualizarPerfilData $datos): User
    {
        $usuarioActualizado = $this->usuarios->actualizar($usuario, $datos->aArrayParaActualizar());

        $this->auditor->registrar('perfil_actualizado', usuario: $usuarioActualizado);

        return $usuarioActualizado;
    }
}
