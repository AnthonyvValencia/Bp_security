<?php

namespace App\Models;

use App\Domain\Panic\Enums\EstadoAlerta;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'usuario_id',
    'comunidad_id',
    'id_cliente',
    'latitud',
    'longitud',
    'estado',
    'creada_en',
    'reconocido_por',
    'reconocido_en',
    'resuelto_por',
    'resuelto_en',
    'notas',
])]
class AlertaPanico extends Model
{
    protected $table = 'alertas_panico';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estado' => EstadoAlerta::class,
            'latitud' => 'decimal:7',
            'longitud' => 'decimal:7',
            'creada_en' => 'datetime',
            'reconocido_en' => 'datetime',
            'resuelto_en' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function reconocidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconocido_por');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function resueltoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resuelto_por');
    }
}
