<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Panic\Enums\EstadoAlerta;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\User;
use Illuminate\Support\Str;

function crearComunidadConLider(User $lider, string $nombre = 'Comunidad Test'): Comunidad
{
    return Comunidad::create([
        'nombre' => $nombre,
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

function activarPayload(?string $idCliente = null): array
{
    return [
        'id_cliente' => $idCliente ?? Str::uuid()->toString(),
        'latitud' => -0.1807,
        'longitud' => -78.4678,
        'creada_en' => now()->toIso8601String(),
    ];
}

it('un ciudadano activa una alerta de pánico sin comunidad', function () {
    $ciudadano = User::factory()->create();

    $respuesta = $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload());

    $respuesta->assertCreated()
        ->assertJsonPath('alerta.estado', 'enviada')
        ->assertJsonPath('alerta.comunidad_id', null);
});

it('la alerta se asocia a la comunidad activa del usuario', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadConLider($lider);
    $ciudadano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $respuesta = $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload());

    $respuesta->assertCreated()->assertJsonPath('alerta.comunidad_id', $comunidad->id);
});

it('reintentar con el mismo id_cliente es idempotente y no duplica la alerta', function () {
    $ciudadano = User::factory()->create();
    $payload = activarPayload();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', $payload)->assertCreated();
    $segundaRespuesta = $this->actingAs($ciudadano)->postJson('/api/alertas-panico', $payload)->assertCreated();

    expect(AlertaPanico::where('id_cliente', $payload['id_cliente'])->count())->toBe(1);
    expect($segundaRespuesta->json('alerta.id_cliente'))->toBe($payload['id_cliente']);
});

it('aplica el límite de 3 alertas nuevas por minuto por usuario', function () {
    $ciudadano = User::factory()->create();

    for ($i = 0; $i < 3; $i++) {
        $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    }

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertStatus(429);
});

it('los reintentos con el mismo id_cliente no cuentan contra el límite', function () {
    $ciudadano = User::factory()->create();
    $primeraAlerta = activarPayload();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', $primeraAlerta)->assertCreated();
    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();

    // Se agotó el límite de 3 alertas nuevas por minuto: una alerta realmente nueva rebota...
    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertStatus(429);

    // ...pero reintentar la primera (mismo id_cliente, ya existente) sí debe pasar.
    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', $primeraAlerta)->assertCreated();
    expect(AlertaPanico::where('id_cliente', $primeraAlerta['id_cliente'])->count())->toBe(1);
});

it('el líder de la comunidad ve y reconoce la alerta, otro líder no puede', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadConLider($lider);
    $otroLider = User::factory()->create(['rol' => RolUsuario::Lider]);
    crearComunidadConLider($otroLider, 'Otra Comunidad');

    $ciudadano = User::factory()->create();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($otroLider)
        ->getJson("/api/comunidades/{$comunidad->id}/alertas-panico")
        ->assertForbidden();

    $this->actingAs($otroLider)
        ->patchJson("/api/alertas-panico/{$alerta->id}/reconocer")
        ->assertForbidden();

    $this->actingAs($lider)
        ->getJson("/api/comunidades/{$comunidad->id}/alertas-panico")
        ->assertOk()
        ->assertJsonCount(1, 'alertas');

    $this->actingAs($lider)
        ->patchJson("/api/alertas-panico/{$alerta->id}/reconocer")
        ->assertOk()
        ->assertJsonPath('alerta.estado', 'reconocida');
});

it('el líder resuelve la alerta y no puede volver a cerrarla', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadConLider($lider);
    $ciudadano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($lider)
        ->patchJson("/api/alertas-panico/{$alerta->id}/resolver", ['notas' => 'Falsa emergencia atendida'])
        ->assertOk()
        ->assertJsonPath('alerta.estado', 'resuelta');

    expect($alerta->fresh()->estado)->toBe(EstadoAlerta::Resuelta);

    $this->actingAs($lider)
        ->patchJson("/api/alertas-panico/{$alerta->id}/resolver")
        ->assertStatus(422);
});

it('el admin ve las alertas sin comunidad asignada', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $ciudadanoSinComunidad = User::factory()->create();

    $this->actingAs($ciudadanoSinComunidad)->postJson('/api/alertas-panico', activarPayload())->assertCreated();

    $this->actingAs($admin)
        ->getJson('/api/admin/alertas-panico/sin-comunidad')
        ->assertOk()
        ->assertJsonCount(1, 'alertas');
});

it('un ciudadano ve su propio historial de alertas', function () {
    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();

    $this->actingAs($ciudadano)
        ->getJson('/api/alertas-panico')
        ->assertOk()
        ->assertJsonCount(2, 'alertas');
});

it('el emisor puede cancelar su propia alerta mientras siga enviada', function () {
    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($ciudadano)
        ->patchJson("/api/alertas-panico/{$alerta->id}/cancelar")
        ->assertOk()
        ->assertJsonPath('alerta.estado', 'cancelada');

    expect($alerta->fresh()->estado)->toBe(EstadoAlerta::Cancelada);
});

it('otro usuario no puede cancelar una alerta ajena', function () {
    $ciudadano = User::factory()->create();
    $otroUsuario = User::factory()->create();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($otroUsuario)
        ->patchJson("/api/alertas-panico/{$alerta->id}/cancelar")
        ->assertForbidden();
});

it('no se puede cancelar una alerta ya reconocida por el líder', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadConLider($lider);
    $ciudadano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($lider)->patchJson("/api/alertas-panico/{$alerta->id}/reconocer")->assertOk();

    $this->actingAs($ciudadano)
        ->patchJson("/api/alertas-panico/{$alerta->id}/cancelar")
        ->assertStatus(422);
});

it('el emisor puede eliminar su propia alerta de su historial en cualquier estado', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadConLider($lider);
    $ciudadano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($lider)->patchJson("/api/alertas-panico/{$alerta->id}/reconocer")->assertOk();

    $this->actingAs($ciudadano)
        ->deleteJson("/api/alertas-panico/{$alerta->id}")
        ->assertOk();

    expect(AlertaPanico::find($alerta->id))->toBeNull();
});

it('otro usuario no puede eliminar una alerta ajena, ni siquiera el líder', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $comunidad = crearComunidadConLider($lider);
    $ciudadano = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $ciudadano->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', activarPayload())->assertCreated();
    $alerta = AlertaPanico::first();

    $this->actingAs($lider)
        ->deleteJson("/api/alertas-panico/{$alerta->id}")
        ->assertForbidden();

    expect(AlertaPanico::find($alerta->id))->not->toBeNull();
});
