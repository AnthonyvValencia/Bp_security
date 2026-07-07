<?php

namespace App\Http\Requests\Reports;

use App\Domain\Reports\Enums\EstadoReporte;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CambiarEstadoReporteRequest extends FormRequest
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
            'estado' => ['required', new Enum(EstadoReporte::class)],
            'comentario' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
