<?php

namespace App\Http\Requests\Panic;

use Illuminate\Foundation\Http\FormRequest;

class CerrarAlertaRequest extends FormRequest
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
            'notas' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
