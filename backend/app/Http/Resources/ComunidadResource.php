<?php

namespace App\Http\Resources;

use App\Models\Comunidad;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Comunidad
 */
class ComunidadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'barrio' => $this->barrio,
            'estado' => $this->estado->value,
            'lider' => $this->whenLoaded('lider', fn () => [
                'id' => $this->lider->id,
                'nombres' => $this->lider->nombres,
                'apellidos' => $this->lider->apellidos,
            ]),
            'total_miembros' => $this->whenCounted('miembros'),
            'creado_en' => $this->created_at,
        ];
    }
}
