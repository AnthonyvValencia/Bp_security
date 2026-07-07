<?php

namespace App\Domain\Panic\DTOs;

use Carbon\Carbon;

readonly class ActivarAlertaData
{
    public function __construct(
        public string $idCliente,
        public ?float $latitud,
        public ?float $longitud,
        public Carbon $creadaEn,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     */
    public static function desdeArray(array $datos): self
    {
        return new self(
            idCliente: $datos['id_cliente'],
            latitud: isset($datos['latitud']) ? (float) $datos['latitud'] : null,
            longitud: isset($datos['longitud']) ? (float) $datos['longitud'] : null,
            creadaEn: Carbon::parse($datos['creada_en']),
        );
    }
}
