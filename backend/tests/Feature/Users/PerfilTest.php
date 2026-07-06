<?php

use App\Models\User;

it('devuelve el perfil del usuario autenticado', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->getJson('/api/perfil');

    $respuesta->assertOk()->assertJsonPath('usuario.email', $usuario->email);
});

it('rechaza el acceso sin autenticación', function () {
    $this->getJson('/api/perfil')->assertUnauthorized();
});

it('actualiza campos parciales del perfil', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->patchJson('/api/perfil', [
        'tipo_sangre' => 'O+',
        'condiciones_medicas' => 'Ninguna',
    ]);

    $respuesta->assertOk()
        ->assertJsonPath('usuario.tipo_sangre', 'O+')
        ->assertJsonPath('usuario.condiciones_medicas', 'Ninguna')
        ->assertJsonPath('usuario.nombres', $usuario->nombres);
});
