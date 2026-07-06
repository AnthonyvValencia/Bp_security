<?php

namespace App\Http\Requests\Users;

use App\Domain\Users\Enums\TipoSangre;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarPerfilRequest extends FormRequest
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
        return [
            'nombres' => ['sometimes', 'string', 'max:100'],
            'apellidos' => ['sometimes', 'string', 'max:100'],
            'telefono' => ['sometimes', 'string', 'max:20'],
            'direccion' => ['sometimes', 'string', 'max:255'],
            'barrio' => ['sometimes', 'string', 'max:100'],
            'numero_casa' => ['sometimes', 'string', 'max:20'],
            'referencias_domicilio' => ['sometimes', 'nullable', 'string'],
            'tipo_sangre' => ['sometimes', 'nullable', Rule::enum(TipoSangre::class)],
            'condiciones_medicas' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
