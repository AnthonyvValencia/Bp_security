<?php

namespace App\Http\Requests\Communities;

use Illuminate\Foundation\Http\FormRequest;

class CambiarLiderRequest extends FormRequest
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
            'nuevo_lider_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
