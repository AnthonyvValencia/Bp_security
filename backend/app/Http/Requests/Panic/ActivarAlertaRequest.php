<?php

namespace App\Http\Requests\Panic;

use Illuminate\Foundation\Http\FormRequest;

class ActivarAlertaRequest extends FormRequest
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
            'id_cliente' => ['required', 'uuid'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'creada_en' => ['required', 'date'],
        ];
    }
}
