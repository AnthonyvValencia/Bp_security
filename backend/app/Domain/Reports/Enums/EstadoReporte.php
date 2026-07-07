<?php

namespace App\Domain\Reports\Enums;

enum EstadoReporte: string
{
    case Abierto = 'abierto';
    case EnRevision = 'en_revision';
    case Resuelto = 'resuelto';
    case Descartado = 'descartado';
}
