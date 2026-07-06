<?php

namespace App\Domain\Users\Enums;

enum EstadoUsuario: string
{
    case Activo = 'activo';
    case Suspendido = 'suspendido';
}
