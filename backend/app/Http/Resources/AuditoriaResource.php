<?php

namespace App\Http\Resources;

use App\Domain\Audit\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Auditoria
 */
class AuditoriaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'accion' => $this->accion,
            'usuario' => $this->usuario ? [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
            ] : null,
            'creado_en' => $this->created_at,
        ];
    }
}
