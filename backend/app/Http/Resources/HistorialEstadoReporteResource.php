<?php

namespace App\Http\Resources;

use App\Models\HistorialEstadoReporte;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin HistorialEstadoReporte
 */
class HistorialEstadoReporteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'estado_anterior' => $this->estado_anterior->value,
            'estado_nuevo' => $this->estado_nuevo->value,
            'comentario' => $this->comentario,
            'cambiado_por' => $this->whenLoaded('cambiadoPor', fn () => [
                'id' => $this->cambiadoPor->id,
                'nombres' => $this->cambiadoPor->nombres,
                'apellidos' => $this->cambiadoPor->apellidos,
            ]),
            'creado_en' => $this->created_at,
        ];
    }
}
