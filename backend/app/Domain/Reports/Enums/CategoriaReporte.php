<?php

namespace App\Domain\Reports\Enums;

enum CategoriaReporte: string
{
    case PersonaSospechosa = 'persona_sospechosa';
    case LuzDaniada = 'luz_daniada';
    case VehiculoMalEstacionado = 'vehiculo_mal_estacionado';
    case RuidosMolestos = 'ruidos_molestos';
    case Otro = 'otro';
}
