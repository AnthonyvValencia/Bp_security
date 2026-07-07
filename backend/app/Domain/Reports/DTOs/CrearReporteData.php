<?php

namespace App\Domain\Reports\DTOs;

use App\Domain\Reports\Enums\CategoriaReporte;

readonly class CrearReporteData
{
    public function __construct(
        public string $titulo,
        public string $descripcion,
        public CategoriaReporte $categoria,
        public ?float $latitud,
        public ?float $longitud,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     */
    public static function desdeArray(array $datos): self
    {
        return new self(
            titulo: $datos['titulo'],
            descripcion: $datos['descripcion'],
            categoria: CategoriaReporte::from($datos['categoria']),
            latitud: isset($datos['latitud']) ? (float) $datos['latitud'] : null,
            longitud: isset($datos['longitud']) ? (float) $datos['longitud'] : null,
        );
    }
}
