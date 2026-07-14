<?php

namespace App\Domain\Users\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Users\Enums\EstadoUsuario;
use App\Domain\Users\Enums\RolUsuario;
use App\Domain\Users\Exceptions\ReglaUsuarioException;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class AdminUsuarioService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    /**
     * @return Collection<int, User>
     */
    public function listar(?string $termino, ?string $rol, ?string $estado): Collection
    {
        return User::query()
            ->with('membresiaActiva.comunidad')
            ->when($termino, function ($query) use ($termino) {
                // LOWER(...) LIKE es case-insensitive y portable (funciona en
                // pgsql de producción y en el SQLite de los tests, a diferencia
                // de ILIKE que es exclusivo de Postgres).
                $patron = '%'.mb_strtolower($termino).'%';

                $query->where(function ($query) use ($patron) {
                    $query->whereRaw('LOWER(nombres) LIKE ?', [$patron])
                        ->orWhereRaw('LOWER(apellidos) LIKE ?', [$patron])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$patron])
                        ->orWhereRaw('LOWER(cedula) LIKE ?', [$patron]);
                });
            })
            ->when($rol, fn ($query) => $query->where('rol', $rol))
            ->when($estado, fn ($query) => $query->where('estado', $estado))
            ->orderBy('nombres')
            ->limit(200)
            ->get();
    }

    public function suspender(User $objetivo, User $admin): User
    {
        if ($objetivo->id === $admin->id) {
            throw new ReglaUsuarioException('No puedes suspender tu propia cuenta.');
        }

        if ($objetivo->estado === EstadoUsuario::Suspendido) {
            throw new ReglaUsuarioException('El usuario ya se encuentra suspendido.');
        }

        $objetivo->update(['estado' => EstadoUsuario::Suspendido]);

        // Corte de acceso inmediato: se revocan todas sus sesiones activas, así
        // que no basta con bloquear futuros logins.
        $objetivo->tokens()->delete();

        $this->auditor->registrar('usuario_suspendido', usuario: $admin, entidadTipo: User::class, entidadId: $objetivo->id);

        return $objetivo->fresh(['membresiaActiva.comunidad']);
    }

    public function reactivar(User $objetivo, User $admin): User
    {
        if ($objetivo->estado === EstadoUsuario::Activo) {
            throw new ReglaUsuarioException('El usuario ya se encuentra activo.');
        }

        $objetivo->update(['estado' => EstadoUsuario::Activo]);

        $this->auditor->registrar('usuario_reactivado', usuario: $admin, entidadTipo: User::class, entidadId: $objetivo->id);

        return $objetivo->fresh(['membresiaActiva.comunidad']);
    }

    public function cambiarRol(User $objetivo, RolUsuario $rol, User $admin): User
    {
        if ($objetivo->id === $admin->id) {
            throw new ReglaUsuarioException('No puedes cambiar tu propio rol.');
        }

        if ($objetivo->rol === $rol) {
            throw new ReglaUsuarioException('El usuario ya tiene ese rol.');
        }

        $objetivo->update(['rol' => $rol]);

        $this->auditor->registrar(
            'rol_usuario_cambiado',
            usuario: $admin,
            entidadTipo: User::class,
            entidadId: $objetivo->id,
            metadatos: ['rol' => $rol->value],
        );

        return $objetivo->fresh(['membresiaActiva.comunidad']);
    }
}
