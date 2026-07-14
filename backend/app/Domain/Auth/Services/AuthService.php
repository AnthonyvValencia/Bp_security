<?php

namespace App\Domain\Auth\Services;

use App\Domain\Audit\Services\Auditor;
use App\Domain\Auth\DTOs\RegistrarUsuarioData;
use App\Domain\Users\Enums\EstadoUsuario;
use App\Domain\Users\Exceptions\CuentaSuspendidaException;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        private readonly Auditor $auditor,
    ) {}

    public function registrar(RegistrarUsuarioData $datos): User
    {
        $usuario = User::create([
            'nombres' => $datos->nombres,
            'apellidos' => $datos->apellidos,
            'cedula' => $datos->cedula,
            'email' => $datos->email,
            'password' => $datos->password,
            'telefono' => $datos->telefono,
            'direccion' => $datos->direccion,
            'barrio' => $datos->barrio,
            'numero_casa' => $datos->numeroCasa,
            'latitud' => $datos->latitud,
            'longitud' => $datos->longitud,
        ])->refresh();

        $this->auditor->registrar('usuario_registrado', usuario: $usuario);

        return $usuario;
    }

    public function iniciarSesion(string $email, string $password, ?Request $request = null): ?User
    {
        $usuario = User::where('email', $email)->first();

        if (! $usuario || ! Hash::check($password, $usuario->password)) {
            $this->auditor->registrar(
                'inicio_sesion_fallido',
                metadatos: ['email' => $email],
                request: $request,
            );

            return null;
        }

        if ($usuario->estado === EstadoUsuario::Suspendido) {
            $this->auditor->registrar('inicio_sesion_bloqueado', usuario: $usuario, request: $request);

            throw new CuentaSuspendidaException('Tu cuenta se encuentra suspendida. Contacta al administrador.');
        }

        $this->auditor->registrar('inicio_sesion', usuario: $usuario, request: $request);

        return $usuario;
    }

    public function cerrarSesion(User $usuario): void
    {
        $usuario->currentAccessToken()->delete();

        $this->auditor->registrar('cierre_sesion', usuario: $usuario);
    }

    public function enviarEnlaceRecuperacion(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    /**
     * @return string Password::PASSWORD_RESET en éxito, o el estado de error de Laravel.
     */
    public function restablecerContrasena(string $email, string $token, string $password): string
    {
        return Password::reset(
            ['email' => $email, 'token' => $token, 'password' => $password],
            function (User $usuario) use ($password): void {
                $usuario->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $usuario->tokens()->delete();

                $this->auditor->registrar('contrasena_restablecida', usuario: $usuario);

                event(new PasswordReset($usuario));
            },
        );
    }
}
