<?php

namespace App\Http\Resources;

use App\Models\MensajeChat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MensajeChat
 */
class MensajeChatResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'comunidad_id' => $this->comunidad_id,
            'usuario_id' => $this->usuario_id,
            'contenido' => $this->contenido,
            'creado_en' => $this->created_at,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nombres' => $this->usuario->nombres,
                'apellidos' => $this->usuario->apellidos,
            ]),
        ];
    }
}
