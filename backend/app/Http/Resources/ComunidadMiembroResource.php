<?php

namespace App\Http\Resources;

use App\Models\ComunidadMiembro;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ComunidadMiembro
 */
class ComunidadMiembroResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'estado' => $this->estado->value,
            'fecha_ingreso' => $this->fecha_ingreso,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
                'email' => $this->usuario->email,
                'telefono' => $this->usuario->telefono,
            ]),
        ];
    }
}
