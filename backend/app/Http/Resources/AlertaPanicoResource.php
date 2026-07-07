<?php

namespace App\Http\Resources;

use App\Models\AlertaPanico;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AlertaPanico
 */
class AlertaPanicoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_cliente' => $this->id_cliente,
            'comunidad_id' => $this->comunidad_id,
            'latitud' => $this->latitud !== null ? (float) $this->latitud : null,
            'longitud' => $this->longitud !== null ? (float) $this->longitud : null,
            'estado' => $this->estado->value,
            'creada_en' => $this->creada_en,
            'reconocido_en' => $this->reconocido_en,
            'resuelto_en' => $this->resuelto_en,
            'notas' => $this->notas,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
                'telefono' => $this->usuario->telefono,
            ]),
        ];
    }
}
