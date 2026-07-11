<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Reports\Enums\EstadoReporte;
use App\Domain\Reports\Events\ReporteActualizado;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\Reporte;
use App\Models\User;
use Illuminate\Support\Facades\Event;

function crearComunidadReportes(User $lider, string $nombre = 'Comunidad Test'): Comunidad
{
    return Comunidad::create([
        'nombre' => $nombre,
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

function agregarMiembro(Comunidad $comunidad, User $usuario): void
{
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $usuario->id,
        'estado' => EstadoMiembro::Activo,
    ]);
}

function reportePayload(): array
{
    return [
        'titulo' => 'Ruido sospechoso',
        'descripcion' => 'Se escucharon ruidos extraños en la calle principal.',
        'categoria' => 'persona_sospechosa',
        'latitud' => -0.1807,
        'longitud' => -78.4678,
    ];
}

it('un ciudadano sin comunidad no puede crear un reporte', function () {
    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)
        ->postJson('/api/reportes', reportePayload())
        ->assertStatus(422);
});

it('un miembro de una comunidad crea un reporte asociado a ella', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $respuesta = $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload());

    $respuesta->assertCreated()
        ->assertJsonPath('reporte.comunidad_id', $comunidad->id)
        ->assertJsonPath('reporte.estado', 'abierto')
        ->assertJsonPath('reporte.categoria', 'persona_sospechosa');
});

it('crear un reporte dispara el broadcast en tiempo real', function () {
    Event::fake([ReporteActualizado::class]);

    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();

    Event::assertDispatched(ReporteActualizado::class);
});

it('aplica el límite de 10 reportes por hora por usuario', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    for ($i = 0; $i < 10; $i++) {
        $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    }

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertStatus(429);
});

it('un ciudadano ve su propio historial de reportes', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();

    $this->actingAs($ciudadano)
        ->getJson('/api/reportes')
        ->assertOk()
        ->assertJsonCount(2, 'reportes');
});

it('el líder ve los reportes de su comunidad, otro líder no puede', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $otroLider = User::factory()->create(['rol' => RolUsuario::Lider]);
    crearComunidadReportes($otroLider, 'Otra Comunidad');

    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();

    $this->actingAs($otroLider)
        ->getJson("/api/comunidades/{$comunidad->id}/reportes")
        ->assertForbidden();

    $this->actingAs($lider)
        ->getJson("/api/comunidades/{$comunidad->id}/reportes")
        ->assertOk()
        ->assertJsonCount(1, 'reportes');
});

it('el líder cambia el estado de un reporte y queda registrado en el historial', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($lider)
        ->patchJson("/api/reportes/{$reporte->id}/estado", [
            'estado' => 'en_revision',
            'comentario' => 'Estamos investigando',
        ])
        ->assertOk()
        ->assertJsonPath('reporte.estado', 'en_revision');

    expect($reporte->fresh()->estado)->toBe(EstadoReporte::EnRevision);
    expect($reporte->fresh()->historialEstados()->count())->toBe(1);

    $this->actingAs($ciudadano)
        ->getJson("/api/reportes/{$reporte->id}")
        ->assertOk()
        ->assertJsonCount(1, 'reporte.historial');
});

it('otro líder no puede cambiar el estado de un reporte ajeno', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $otroLider = User::factory()->create(['rol' => RolUsuario::Lider]);
    crearComunidadReportes($otroLider, 'Otra Comunidad');

    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($otroLider)
        ->patchJson("/api/reportes/{$reporte->id}/estado", ['estado' => 'resuelto'])
        ->assertForbidden();
});

it('no permite cambiar a un reporte al mismo estado en el que ya está', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($lider)
        ->patchJson("/api/reportes/{$reporte->id}/estado", ['estado' => 'abierto'])
        ->assertStatus(422);
});

it('un usuario ajeno no puede ver el detalle de un reporte que no es suyo ni de su comunidad', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);
    $extrano = User::factory()->create();

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($extrano)
        ->getJson("/api/reportes/{$reporte->id}")
        ->assertForbidden();
});

it('el autor puede eliminar su propio reporte', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($ciudadano)
        ->deleteJson("/api/reportes/{$reporte->id}")
        ->assertOk();

    expect(Reporte::find($reporte->id))->toBeNull();
});

it('un usuario que no es el autor no puede eliminar el reporte, ni siquiera el líder', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadReportes($lider);
    $ciudadano = User::factory()->create();
    agregarMiembro($comunidad, $ciudadano);

    $this->actingAs($ciudadano)->postJson('/api/reportes', reportePayload())->assertCreated();
    $reporte = Reporte::first();

    $this->actingAs($lider)
        ->deleteJson("/api/reportes/{$reporte->id}")
        ->assertForbidden();

    expect(Reporte::find($reporte->id))->not->toBeNull();
});
