<?php

namespace App\Domain\Communities\DTOs;

readonly class SolicitarCrearComunidadData
{
    public function __construct(
        public string $nombre,
        public ?string $descripcion,
        public string $barrio,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     */
    public static function desdeArray(array $datos): self
    {
        return new self(
            nombre: $datos['nombre'],
            descripcion: $datos['descripcion'] ?? null,
            barrio: $datos['barrio'],
        );
    }
}
