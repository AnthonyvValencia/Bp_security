<?php

use App\Domain\Auth\Notifications\RestablecerContrasenaNotification;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

it('envía el correo con el código de recuperación (sin depender de rutas web)', function () {
    Notification::fake();

    $usuario = User::factory()->create(['email' => 'vecino@bp.test']);

    $this->postJson('/api/auth/olvide-contrasena', ['email' => 'vecino@bp.test'])
        ->assertOk()
        ->assertJsonPath('mensaje', 'Enlace de recuperación enviado a tu correo.');

    Notification::assertSentTo(
        $usuario,
        RestablecerContrasenaNotification::class,
        fn (RestablecerContrasenaNotification $notificacion) => $notificacion->token !== '',
    );
});

it('el correo renderiza sin la ruta web password.reset', function () {
    // La notificación por defecto de Laravel explotaba aquí con
    // "Route [password.reset] not defined" al armar el enlace.
    $usuario = User::factory()->create();

    $correo = (new RestablecerContrasenaNotification('codigo-de-prueba'))->toMail($usuario);
    $render = $correo->render();

    expect((string) $render)->toContain('codigo-de-prueba');
});

it('completa el ciclo: solicitar código, restablecer y entrar con la nueva contraseña', function () {
    Notification::fake();

    $usuario = User::factory()->create([
        'email' => 'vecino@bp.test',
        'password' => 'clave-anterior-123',
    ]);
    $tokenSesion = $usuario->createToken('mobile')->plainTextToken;

    $this->postJson('/api/auth/olvide-contrasena', ['email' => 'vecino@bp.test'])->assertOk();

    // Capturamos el código exactamente como llegaría en el correo.
    $codigo = null;
    Notification::assertSentTo(
        $usuario,
        RestablecerContrasenaNotification::class,
        function (RestablecerContrasenaNotification $notificacion) use (&$codigo) {
            $codigo = $notificacion->token;

            return true;
        },
    );

    $this->postJson('/api/auth/restablecer-contrasena', [
        'email' => 'vecino@bp.test',
        'token' => $codigo,
        'password' => 'clave-nueva-456',
        'password_confirmation' => 'clave-nueva-456',
    ])->assertOk()->assertJsonPath('mensaje', 'Contraseña restablecida correctamente.');

    // Las sesiones anteriores quedan revocadas...
    expect($usuario->tokens()->count())->toBe(0);
    expect($tokenSesion)->not->toBeEmpty();

    // ...la clave vieja ya no sirve y la nueva sí.
    $this->postJson('/api/auth/login', [
        'email' => 'vecino@bp.test',
        'password' => 'clave-anterior-123',
    ])->assertStatus(422);

    $this->postJson('/api/auth/login', [
        'email' => 'vecino@bp.test',
        'password' => 'clave-nueva-456',
    ])->assertOk()->assertJsonStructure(['token']);
});

it('rechaza un código inválido sin cambiar la contraseña', function () {
    $usuario = User::factory()->create([
        'email' => 'vecino@bp.test',
        'password' => 'clave-anterior-123',
    ]);

    $this->postJson('/api/auth/restablecer-contrasena', [
        'email' => 'vecino@bp.test',
        'token' => 'codigo-invalido',
        'password' => 'clave-nueva-456',
        'password_confirmation' => 'clave-nueva-456',
    ])->assertStatus(422);

    $this->postJson('/api/auth/login', [
        'email' => 'vecino@bp.test',
        'password' => 'clave-anterior-123',
    ])->assertOk();
});
