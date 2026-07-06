<?php

namespace App\Http\Requests\Communities;

use Illuminate\Foundation\Http\FormRequest;

class SolicitarCrearComunidadRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:100', 'unique:comunidades,nombre'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'barrio' => ['required', 'string', 'max:100'],
        ];
    }
}
