<?php

namespace App\Domain\Communities\Enums;

enum TipoSolicitud: string
{
    case Unirse = 'unirse';
    case Crear = 'crear';
}
