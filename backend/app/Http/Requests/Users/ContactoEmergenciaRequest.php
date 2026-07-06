<?php

namespace App\Http\Requests\Users;

use Illuminate\Foundation\Http\FormRequest;

class ContactoEmergenciaRequest extends FormRequest
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
        $sometimesEnCreacion = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'nombre' => [$sometimesEnCreacion, 'string', 'max:100'],
            'telefono' => [$sometimesEnCreacion, 'string', 'max:20'],
            'parentesco' => ['nullable', 'string', 'max:50'],
        ];
    }
}
