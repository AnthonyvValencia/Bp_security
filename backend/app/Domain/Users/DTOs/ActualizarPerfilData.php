<?php

namespace App\Domain\Users\DTOs;

readonly class ActualizarPerfilData
{
    public function __construct(
        public ?string $nombres = null,
        public ?string $apellidos = null,
        public ?string $telefono = null,
        public ?string $direccion = null,
        public ?string $barrio = null,
        public ?string $numeroCasa = null,
        public ?string $referenciasDomicilio = null,
        public ?string $tipoSangre = null,
        public ?string $condicionesMedicas = null,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     */
    public static function desdeArray(array $datos): self
    {
        return new self(
            nombres: $datos['nombres'] ?? null,
            apellidos: $datos['apellidos'] ?? null,
            telefono: $datos['telefono'] ?? null,
            direccion: $datos['direccion'] ?? null,
            barrio: $datos['barrio'] ?? null,
            numeroCasa: $datos['numero_casa'] ?? null,
            referenciasDomicilio: $datos['referencias_domicilio'] ?? null,
            tipoSangre: $datos['tipo_sangre'] ?? null,
            condicionesMedicas: $datos['condiciones_medicas'] ?? null,
        );
    }

    /**
     * Solo los campos presentes (no null), listos para un update() parcial.
     *
     * @return array<string, mixed>
     */
    public function aArrayParaActualizar(): array
    {
        $mapa = [
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'barrio' => $this->barrio,
            'numero_casa' => $this->numeroCasa,
            'referencias_domicilio' => $this->referenciasDomicilio,
            'tipo_sangre' => $this->tipoSangre,
            'condiciones_medicas' => $this->condicionesMedicas,
        ];

        return array_filter($mapa, fn (mixed $valor): bool => $valor !== null);
    }
}
