<?php

namespace App\Domain\Panic\Enums;

enum EstadoAlerta: string
{
    case Enviada = 'enviada';
    case Reconocida = 'reconocida';
    case Resuelta = 'resuelta';
    case FalsaAlarma = 'falsa_alarma';
    case Cancelada = 'cancelada';
}
