<?php

namespace App\Http\Resources;

use App\Models\ContactoEmergencia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ContactoEmergencia
 */
class ContactoEmergenciaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'telefono' => $this->telefono,
            'parentesco' => $this->parentesco,
        ];
    }
}
