<?php

namespace App\Models;

use App\Domain\Reports\Enums\EstadoReporte;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['reporte_id', 'estado_anterior', 'estado_nuevo', 'cambiado_por', 'comentario'])]
class HistorialEstadoReporte extends Model
{
    protected $table = 'reporte_historial_estados';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estado_anterior' => EstadoReporte::class,
            'estado_nuevo' => EstadoReporte::class,
        ];
    }

    /**
     * @return BelongsTo<Reporte, $this>
     */
    public function reporte(): BelongsTo
    {
        return $this->belongsTo(Reporte::class, 'reporte_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function cambiadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cambiado_por');
    }
}
