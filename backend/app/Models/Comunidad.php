<?php

namespace App\Models;

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['nombre', 'descripcion', 'barrio', 'lider_id', 'estado', 'aprobado_por', 'aprobado_en'])]
class Comunidad extends Model
{
    use SoftDeletes;

    protected $table = 'comunidades';

    /**
     * Una comunidad suspendida por el admin queda congelada socialmente
     * (sin chat ni reportes nuevos), pero el botón de pánico sigue activo.
     */
    public function estaSuspendida(): bool
    {
        return $this->estado === EstadoComunidad::Suspendida;
    }

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
     * Solo membresías activas — para conteos y listados de cara al usuario.
     * `miembros()` sin filtro conserva el historial (retirados/expulsados).
     *
     * @return HasMany<ComunidadMiembro, $this>
     */
    public function miembrosActivos(): HasMany
    {
        return $this->miembros()->where('estado', EstadoMiembro::Activo);
    }

    /**
     * Miembros activos con actividad en los últimos 5 minutos — aproximación
     * simple de "presencia en línea" sin necesidad de WebSockets.
     *
     * @return HasMany<ComunidadMiembro, $this>
     */
    public function miembrosConectados(): HasMany
    {
        return $this->miembros()
            ->where('estado', EstadoMiembro::Activo)
            ->whereHas('usuario', fn ($query) => $query->where('ultima_actividad_en', '>=', now()->subMinutes(5)));
    }

    /**
     * @return HasMany<SolicitudMembresia, $this>
     */
    public function solicitudes(): HasMany
    {
        return $this->hasMany(SolicitudMembresia::class, 'comunidad_id');
    }

    /**
     * @return HasMany<AlertaPanico, $this>
     */
    public function alertasPanico(): HasMany
    {
        return $this->hasMany(AlertaPanico::class, 'comunidad_id');
    }

    /**
     * @return HasMany<Reporte, $this>
     */
    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class, 'comunidad_id');
    }
}
