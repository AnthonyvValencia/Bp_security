<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\SolicitudMembresia;
use App\Models\User;

function crearComunidadAprobada(User $lider, string $nombre = 'Comunidad Test'): Comunidad
{
    return Comunidad::create([
        'nombre' => $nombre,
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

it('un ciudadano puede solicitar unirse a una comunidad aprobada', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $ciudadano = User::factory()->create();

    $respuesta = $this->actingAs($ciudadano)
        ->postJson("/api/comunidades/{$comunidad->id}/solicitudes");

    $respuesta->assertCreated()->assertJsonPath('solicitud.tipo', 'unirse');
});

it('rechaza una segunda solicitud pendiente a la misma comunidad', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)->postJson("/api/comunidades/{$comunidad->id}/solicitudes")->assertCreated();
    $this->actingAs($ciudadano)->postJson("/api/comunidades/{$comunidad->id}/solicitudes")->assertStatus(422);
});

it('un usuario que no es el líder no puede ver ni aprobar solicitudes de esa comunidad', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $otroUsuario = User::factory()->create();
    $solicitante = User::factory()->create();

    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $this->actingAs($otroUsuario)
        ->getJson("/api/comunidades/{$comunidad->id}/solicitudes")
        ->assertForbidden();

    $this->actingAs($otroUsuario)
        ->postJson("/api/solicitudes-membresia/{$solicitud->id}/aprobar")
        ->assertForbidden();
});

it('el líder aprueba una solicitud de ingreso y el usuario queda como miembro activo', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $solicitante = User::factory()->create();

    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $this->actingAs($lider)
        ->postJson("/api/solicitudes-membresia/{$solicitud->id}/aprobar")
        ->assertOk();

    expect(ComunidadMiembro::where('comunidad_id', $comunidad->id)
        ->where('usuario_id', $solicitante->id)
        ->where('estado', EstadoMiembro::Activo)
        ->exists())->toBeTrue();
    expect($solicitud->fresh()->estado)->toBe(EstadoSolicitud::Aprobada);
});

it('el líder rechaza una solicitud de ingreso', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $solicitante = User::factory()->create();

    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $this->actingAs($lider)
        ->postJson("/api/solicitudes-membresia/{$solicitud->id}/rechazar", ['motivo' => 'No aplica'])
        ->assertOk();

    expect($solicitud->fresh()->estado)->toBe(EstadoSolicitud::Rechazada);
    expect(ComunidadMiembro::where('usuario_id', $solicitante->id)->exists())->toBeFalse();
});

it('el líder puede expulsar a un miembro de su comunidad', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $miembroUsuario = User::factory()->create();

    $miembro = ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembroUsuario->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($lider)
        ->deleteJson("/api/comunidades/{$comunidad->id}/miembros/{$miembro->id}")
        ->assertOk();

    expect($miembro->fresh()->estado)->toBe(EstadoMiembro::Expulsado);
});

it('un miembro activo puede ver la lista de miembros, un extraño no', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadAprobada($lider);
    $miembroUsuario = User::factory()->create();
    $extrano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembroUsuario->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($miembroUsuario)
        ->getJson("/api/comunidades/{$comunidad->id}/miembros")
        ->assertOk();

    $this->actingAs($extrano)
        ->getJson("/api/comunidades/{$comunidad->id}/miembros")
        ->assertForbidden();
});
