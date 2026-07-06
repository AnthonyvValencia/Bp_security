<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UsuarioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'cedula' => $this->cedula,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'barrio' => $this->barrio,
            'numero_casa' => $this->numero_casa,
            'referencias_domicilio' => $this->referencias_domicilio,
            'foto' => $this->foto,
            'rol' => $this->rol->value,
            'estado' => $this->estado->value,
            'tipo_sangre' => $this->tipo_sangre?->value,
            'condiciones_medicas' => $this->condiciones_medicas,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'contactos_emergencia' => ContactoEmergenciaResource::collection(
                $this->whenLoaded('contactosEmergencia'),
            ),
        ];
    }
}
