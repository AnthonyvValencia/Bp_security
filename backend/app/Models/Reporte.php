<?php

namespace App\Models;

use App\Domain\Reports\Enums\CategoriaReporte;
use App\Domain\Reports\Enums\EstadoReporte;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'usuario_id',
    'comunidad_id',
    'titulo',
    'descripcion',
    'categoria',
    'latitud',
    'longitud',
    'estado',
])]
class Reporte extends Model
{
    protected $table = 'reportes';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'categoria' => CategoriaReporte::class,
            'estado' => EstadoReporte::class,
            'latitud' => 'decimal:7',
            'longitud' => 'decimal:7',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * @return BelongsTo<Comunidad, $this>
     */
    public function comunidad(): BelongsTo
    {
        return $this->belongsTo(Comunidad::class, 'comunidad_id');
    }

    /**
     * @return HasMany<HistorialEstadoReporte, $this>
     */
    public function historialEstados(): HasMany
    {
        return $this->hasMany(HistorialEstadoReporte::class, 'reporte_id')->orderBy('created_at');
    }
}
