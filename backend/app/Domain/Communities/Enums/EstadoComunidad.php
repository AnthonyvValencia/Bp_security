<?php

namespace App\Domain\Communities\Enums;

enum EstadoComunidad: string
{
    case Pendiente = 'pendiente';
    case Aprobada = 'aprobada';
    case Rechazada = 'rechazada';
}
