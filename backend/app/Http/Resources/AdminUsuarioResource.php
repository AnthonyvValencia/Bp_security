<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista de un usuario para el panel del administrador. Incluye datos de
 * contacto e identidad (el admin sí verifica identidad) pero NO datos médicos
 * de emergencia (tipo de sangre, condiciones), que quedan reservados.
 *
 * @mixin User
 */
class AdminUsuarioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $comunidad = $this->membresiaActiva?->comunidad;

        return [
            'id' => $this->id,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'cedula' => $this->cedula,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'barrio' => $this->barrio,
            'direccion' => $this->direccion,
            'numero_casa' => $this->numero_casa,
            'referencias_domicilio' => $this->referencias_domicilio,
            'foto' => $this->foto,
            'rol' => $this->rol->value,
            'estado' => $this->estado->value,
            'miembro_desde' => $this->created_at,
            'comunidad' => $comunidad ? [
                'id' => $comunidad->id,
                'nombre' => $comunidad->nombre,
            ] : null,
        ];
    }
}
