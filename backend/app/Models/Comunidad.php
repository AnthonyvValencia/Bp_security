<?php

namespace App\Models;

use App\Domain\Communities\Enums\EstadoComunidad;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['nombre', 'descripcion', 'barrio', 'lider_id', 'estado', 'aprobado_por', 'aprobado_en'])]
class Comunidad extends Model
{
    protected $table = 'comunidades';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estado' => EstadoComunidad::class,
            'aprobado_en' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function lider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lider_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function aprobadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    /**
     * @return HasMany<ComunidadMiembro, $this>
     */
    public function miembros(): HasMany
    {
        return $this->hasMany(ComunidadMiembro::class, 'comunidad_id');
    }

    /**
     * @return HasMany<SolicitudMembresia, $this>
     */
    public function solicitudes(): HasMany
    {
        return $this->hasMany(SolicitudMembresia::class, 'comunidad_id');
    }
}
