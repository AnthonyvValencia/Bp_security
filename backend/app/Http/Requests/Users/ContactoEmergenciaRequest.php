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
            // Solo dígitos, con un '+' inicial opcional. El teléfono alimenta los
            // enlaces tel:/sms: del botón de pánico, así que cualquier símbolo o
            // letra lo dejaría inservible en una emergencia.
            'telefono' => [$sometimesEnCreacion, 'string', 'regex:/^\+?[0-9]{7,15}$/'],
            'parentesco' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'telefono.regex' => 'Ingresa un teléfono válido: solo dígitos (7 a 15), con un + inicial opcional.',
        ];
    }
}
