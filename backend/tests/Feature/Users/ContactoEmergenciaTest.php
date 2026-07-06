<?php

use App\Models\User;

it('crea un contacto de emergencia para el usuario autenticado', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->postJson('/api/contactos-emergencia', [
        'nombre' => 'María Pérez',
        'telefono' => '0987654321',
        'parentesco' => 'Madre',
    ]);

    $respuesta->assertCreated()->assertJsonPath('contacto_emergencia.nombre', 'María Pérez');
    expect($usuario->contactosEmergencia()->count())->toBe(1);
});

it('impide editar o eliminar el contacto de otro usuario', function () {
    $usuario = User::factory()->create();
    $otroUsuario = User::factory()->create();
    $contacto = $otroUsuario->contactosEmergencia()->create([
        'nombre' => 'Contacto Ajeno',
        'telefono' => '0999999999',
    ]);

    $this->actingAs($usuario)
        ->patchJson("/api/contactos-emergencia/{$contacto->id}", ['nombre' => 'Hackeado'])
        ->assertForbidden();

    $this->actingAs($usuario)
        ->deleteJson("/api/contactos-emergencia/{$contacto->id}")
        ->assertForbidden();
});
