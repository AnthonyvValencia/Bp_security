<?php

use App\Domain\Audit\Models\Auditoria;
use App\Models\User;

it('registra un usuario nuevo y devuelve un token', function () {
    $respuesta = $this->postJson('/api/auth/registro', [
        'nombres' => 'Juan',
        'apellidos' => 'Pérez',
        'cedula' => '0912345678',
        'email' => 'juan@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0991234567',
        'direccion' => 'Av. Siempre Viva 123',
        'barrio' => 'La Floresta',
        'numero_casa' => '12B',
    ]);

    $respuesta->assertCreated()
        ->assertJsonPath('usuario.email', 'juan@example.com')
        ->assertJsonPath('usuario.cedula', '0912345678')
        ->assertJsonPath('usuario.rol', 'ciudadano')
        ->assertJsonStructure(['usuario', 'token']);

    expect(User::where('email', 'juan@example.com')->exists())->toBeTrue();
    expect(Auditoria::where('accion', 'usuario_registrado')->exists())->toBeTrue();
});

it('rechaza el registro con email duplicado', function () {
    User::factory()->create(['email' => 'existe@example.com']);

    $respuesta = $this->postJson('/api/auth/registro', [
        'nombres' => 'Ana',
        'apellidos' => 'Gómez',
        'cedula' => '0987654321',
        'email' => 'existe@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0991234567',
        'direccion' => 'Calle Falsa 123',
        'barrio' => 'Centro',
        'numero_casa' => '1',
    ]);

    $respuesta->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('rechaza el registro con cédula duplicada o inválida', function () {
    User::factory()->create(['cedula' => '1111111111']);

    $this->postJson('/api/auth/registro', [
        'nombres' => 'Luis',
        'apellidos' => 'Cedeño',
        'cedula' => '1111111111',
        'email' => 'luis@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0991234567',
        'direccion' => 'Calle 1',
        'barrio' => 'Centro',
        'numero_casa' => '3',
    ])->assertUnprocessable()->assertJsonValidationErrors('cedula');

    $this->postJson('/api/auth/registro', [
        'nombres' => 'Luis',
        'apellidos' => 'Cedeño',
        'cedula' => '12AB',
        'email' => 'luis2@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0991234567',
        'direccion' => 'Calle 1',
        'barrio' => 'Centro',
        'numero_casa' => '3',
    ])->assertUnprocessable()->assertJsonValidationErrors('cedula');
});

it('acepta latitud y longitud opcionales del botón de ubicación', function () {
    $respuesta = $this->postJson('/api/auth/registro', [
        'nombres' => 'Carlos',
        'apellidos' => 'Ruiz',
        'cedula' => '0911111111',
        'email' => 'carlos@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0991234567',
        'direccion' => 'Calle 1',
        'barrio' => 'Barrio 1',
        'numero_casa' => '2',
        'latitud' => -0.1807,
        'longitud' => -78.4678,
    ]);

    $respuesta->assertCreated();

    $usuario = User::where('email', 'carlos@example.com')->first();
    expect((float) $usuario->latitud)->toBe(-0.1807)
        ->and((float) $usuario->longitud)->toBe(-78.4678);
});
