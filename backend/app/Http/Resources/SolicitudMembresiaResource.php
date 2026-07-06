<?php

namespace App\Http\Resources;

use App\Models\SolicitudMembresia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SolicitudMembresia
 */
class SolicitudMembresiaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo->value,
            'estado' => $this->estado->value,
            'nombre_comunidad_propuesto' => $this->nombre_comunidad_propuesto,
            'descripcion_comunidad_propuesta' => $this->descripcion_comunidad_propuesta,
            'barrio_comunidad_propuesto' => $this->barrio_comunidad_propuesto,
            'motivo' => $this->motivo,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
                'email' => $this->usuario->email,
            ]),
            'creado_en' => $this->created_at,
        ];
    }
}
