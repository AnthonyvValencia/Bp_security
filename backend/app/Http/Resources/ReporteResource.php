<?php

namespace App\Http\Resources;

use App\Models\Reporte;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Reporte
 */
class ReporteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'comunidad_id' => $this->comunidad_id,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
            'categoria' => $this->categoria->value,
            'latitud' => $this->latitud !== null ? (float) $this->latitud : null,
            'longitud' => $this->longitud !== null ? (float) $this->longitud : null,
            'estado' => $this->estado->value,
            'creado_en' => $this->created_at,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
                'telefono' => $this->usuario->telefono,
            ]),
            'historial' => HistorialEstadoReporteResource::collection(
                $this->whenLoaded('historialEstados'),
            ),
        ];
    }
}
