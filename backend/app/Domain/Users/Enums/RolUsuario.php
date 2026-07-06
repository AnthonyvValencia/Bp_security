<?php

namespace App\Domain\Users\Enums;

enum RolUsuario: string
{
    case Administrador = 'administrador';
    case Lider = 'lider';
    case Ciudadano = 'ciudadano';
}
