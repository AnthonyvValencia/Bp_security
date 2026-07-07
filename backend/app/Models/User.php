<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Users\Enums\EstadoUsuario;
use App\Domain\Users\Enums\RolUsuario;
use App\Domain\Users\Enums\TipoSangre;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'nombres',
    'apellidos',
    'cedula',
    'email',
    'password',
    'telefono',
    'direccion',
    'barrio',
    'numero_casa',
    'referencias_domicilio',
    'foto',
    'rol',
    'estado',
    'tipo_sangre',
    'condiciones_medicas',
    'latitud',
    'longitud',
    'ultima_actividad_en',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Espejan los defaults de la migración para que un modelo recién creado
     * (sin refresh()) ya refleje rol/estado en memoria, no solo en la fila de la BD.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'rol' => 'ciudadano',
        'estado' => 'activo',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'rol' => RolUsuario::class,
            'estado' => EstadoUsuario::class,
            'tipo_sangre' => TipoSangre::class,
            'latitud' => 'decimal:7',
            'longitud' => 'decimal:7',
            'ultima_actividad_en' => 'datetime',
        ];
    }

    /**
     * @return HasMany<ContactoEmergencia, $this>
     */
    public function contactosEmergencia(): HasMany
    {
        return $this->hasMany(ContactoEmergencia::class, 'usuario_id');
    }

    /**
     * @return HasMany<AlertaPanico, $this>
     */
    public function alertasPanico(): HasMany
    {
        return $this->hasMany(AlertaPanico::class, 'usuario_id');
    }

    /**
     * @return HasMany<Reporte, $this>
     */
    public function reportes(): HasMany
    {
        return $this->hasMany(Reporte::class, 'usuario_id');
    }

    /**
     * Membresía activa actual (un ciudadano pertenece a una sola comunidad a la vez).
     *
     * @return HasOne<ComunidadMiembro, $this>
     */
    public function membresiaActiva(): HasOne
    {
        return $this->hasOne(ComunidadMiembro::class, 'usuario_id')
            ->where('estado', EstadoMiembro::Activo);
    }

    /**
     * Comunidad que este usuario lidera, si aplica.
     *
     * @return HasOne<Comunidad, $this>
     */
    public function comunidadLiderada(): HasOne
    {
        return $this->hasOne(Comunidad::class, 'lider_id');
    }
}
