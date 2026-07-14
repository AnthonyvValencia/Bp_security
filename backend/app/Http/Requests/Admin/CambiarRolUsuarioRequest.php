<?php

namespace App\Http\Requests\Admin;

use App\Domain\Users\Enums\RolUsuario;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CambiarRolUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Solo se permite alternar entre administrador y ciudadano: el rol
        // "líder" no se asigna por aquí, se deriva de ser el lider_id de una
        // comunidad.
        return [
            'rol' => ['required', Rule::in([RolUsuario::Administrador->value, RolUsuario::Ciudadano->value])],
        ];
    }
}
