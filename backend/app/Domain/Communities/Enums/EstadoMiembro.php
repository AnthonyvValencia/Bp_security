<?php

namespace App\Domain\Communities\Enums;

enum EstadoMiembro: string
{
    case Activo = 'activo';
    case Expulsado = 'expulsado';
    case Retirado = 'retirado';
}
