<?php

use App\Domain\Audit\Models\Auditoria;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('inicia sesión con credenciales correctas', function () {
    $usuario = User::factory()->create(['password' => Hash::make('password123')]);

    $respuesta = $this->postJson('/api/auth/login', [
        'email' => $usuario->email,
        'password' => 'password123',
    ]);

    $respuesta->assertOk()->assertJsonStructure(['usuario', 'token']);
    expect(Auditoria::where('accion', 'inicio_sesion')->where('usuario_id', $usuario->id)->exists())->toBeTrue();
});

it('rechaza credenciales incorrectas', function () {
    $usuario = User::factory()->create(['password' => Hash::make('password123')]);

    $respuesta = $this->postJson('/api/auth/login', [
        'email' => $usuario->email,
        'password' => 'incorrecta',
    ]);

    $respuesta->assertUnprocessable()->assertJsonValidationErrors('email');
    expect(Auditoria::where('accion', 'inicio_sesion_fallido')->exists())->toBeTrue();
});

it('aplica rate limit tras varios intentos fallidos de login', function () {
    $usuario = User::factory()->create(['password' => Hash::make('password123')]);

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/auth/login', [
            'email' => $usuario->email,
            'password' => 'incorrecta',
        ]);
    }

    $respuesta = $this->postJson('/api/auth/login', [
        'email' => $usuario->email,
        'password' => 'incorrecta',
    ]);

    $respuesta->assertStatus(429);
});

it('cierra sesión y revoca el token actual', function () {
    $usuario = User::factory()->create();
    $token = $usuario->createToken('mobile')->plainTextToken;

    $respuesta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout');

    $respuesta->assertOk();
    expect($usuario->tokens()->count())->toBe(0);
});
