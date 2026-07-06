<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\SolicitudMembresia;
use App\Models\User;

it('un ciudadano puede solicitar crear una comunidad', function () {
    $ciudadano = User::factory()->create();

    $respuesta = $this->actingAs($ciudadano)->postJson('/api/comunidades', [
        'nombre' => 'La Floresta',
        'descripcion' => 'Comunidad del barrio La Floresta',
        'barrio' => 'La Floresta',
    ]);

    $respuesta->assertCreated()->assertJsonPath('solicitud.tipo', 'crear');
    expect(SolicitudMembresia::where('usuario_id', $ciudadano->id)->exists())->toBeTrue();
});

it('rechaza solicitar crear una comunidad si ya pertenece a una activa', function () {
    $lider = User::factory()->create();
    $comunidad = Comunidad::create([
        'nombre' => 'Existente',
        'barrio' => 'Centro',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);

    $miembro = User::factory()->create();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($miembro)->postJson('/api/comunidades', [
        'nombre' => 'Otra',
        'barrio' => 'Otro barrio',
    ])->assertStatus(422);
});

it('un usuario que no es admin no puede aprobar comunidades', function () {
    $ciudadano = User::factory()->create();
    $solicitante = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'crear',
        'nombre_comunidad_propuesto' => 'Nueva',
        'barrio_comunidad_propuesto' => 'Barrio',
    ]);

    $this->actingAs($ciudadano)
        ->postJson("/api/admin/comunidades/solicitudes/{$solicitud->id}/aprobar")
        ->assertForbidden();
});

it('el admin aprueba una solicitud de creación y se asigna el líder automáticamente', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $solicitante = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'crear',
        'nombre_comunidad_propuesto' => 'Nueva Comunidad',
        'descripcion_comunidad_propuesta' => 'Descripción',
        'barrio_comunidad_propuesto' => 'Barrio X',
    ]);

    $respuesta = $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/solicitudes/{$solicitud->id}/aprobar");

    $respuesta->assertOk()->assertJsonPath('comunidad.nombre', 'Nueva Comunidad');

    $comunidad = Comunidad::where('nombre', 'Nueva Comunidad')->first();
    expect($comunidad->lider_id)->toBe($solicitante->id)
        ->and($comunidad->estado)->toBe(EstadoComunidad::Aprobada);

    expect(ComunidadMiembro::where('comunidad_id', $comunidad->id)
        ->where('usuario_id', $solicitante->id)
        ->where('estado', EstadoMiembro::Activo)
        ->exists())->toBeTrue();

    expect($solicitud->fresh()->estado)->toBe(EstadoSolicitud::Aprobada);
});

it('el admin rechaza una solicitud de creación', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $solicitante = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'crear',
        'nombre_comunidad_propuesto' => 'Rechazada',
        'barrio_comunidad_propuesto' => 'Barrio',
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/solicitudes/{$solicitud->id}/rechazar", ['motivo' => 'Nombre duplicado'])
        ->assertOk();

    expect($solicitud->fresh()->estado)->toBe(EstadoSolicitud::Rechazada);
    expect(Comunidad::where('nombre', 'Rechazada')->exists())->toBeFalse();
});

it('la búsqueda de comunidades solo devuelve las aprobadas', function () {
    $lider = User::factory()->create();
    Comunidad::create(['nombre' => 'Aprobada A', 'barrio' => 'B1', 'lider_id' => $lider->id, 'estado' => EstadoComunidad::Aprobada]);
    Comunidad::create(['nombre' => 'Pendiente B', 'barrio' => 'B2', 'estado' => EstadoComunidad::Pendiente]);

    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->getJson('/api/comunidades');

    $respuesta->assertOk();
    $nombres = collect($respuesta->json('comunidades'))->pluck('nombre');
    expect($nombres)->toContain('Aprobada A')->not->toContain('Pendiente B');
});
