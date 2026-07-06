<?php

namespace App\Domain\Auth\DTOs;

readonly class RegistrarUsuarioData
{
    public function __construct(
        public string $nombres,
        public string $apellidos,
        public string $cedula,
        public string $email,
        public string $password,
        public string $telefono,
        public string $direccion,
        public string $barrio,
        public string $numeroCasa,
        public ?float $latitud = null,
        public ?float $longitud = null,
    ) {}

    /**
     * @param  array<string, mixed>  $datos
     */
    public static function desdeArray(array $datos): self
    {
        return new self(
            nombres: $datos['nombres'],
            apellidos: $datos['apellidos'],
            cedula: $datos['cedula'],
            email: $datos['email'],
            password: $datos['password'],
            telefono: $datos['telefono'],
            direccion: $datos['direccion'],
            barrio: $datos['barrio'],
            numeroCasa: $datos['numero_casa'],
            latitud: $datos['latitud'] ?? null,
            longitud: $datos['longitud'] ?? null,
        );
    }
}
