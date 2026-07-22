<?php

namespace App\Models;

use App\Domain\Communities\Enums\EstadoMiembro;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['comunidad_id', 'usuario_id', 'estado', 'fecha_ingreso', 'chat_leido_id'])]
class ComunidadMiembro extends Model
{
    protected $table = 'comunidad_miembros';

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'estado' => 'activo',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estado' => EstadoMiembro::class,
            'fecha_ingreso' => 'datetime',
        ];
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
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
