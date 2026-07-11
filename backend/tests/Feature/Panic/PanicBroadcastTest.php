<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Panic\Events\AlertaPanicoActualizada;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

// El entorno de test fija BROADCAST_CONNECTION=null (el driver "null" no
// verifica canales, autoriza siempre) — para probar de verdad la Policy de
// autorización forzamos el driver "reverb" (su firma se calcula localmente,
// sin necesitar un servidor Reverb corriendo) y volvemos a registrar los
// canales de routes/channels.php, ya que quedaron registrados contra la
// instancia "null" original al arrancar la app.
beforeEach(function () {
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');
});

function crearComunidadParaBroadcast(User $lider): Comunidad
{
    return Comunidad::create([
        'nombre' => 'Comunidad Broadcast',
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

it('activar una alerta dispara el evento de broadcast en tiempo real', function () {
    Event::fake([AlertaPanicoActualizada::class]);

    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)->postJson('/api/alertas-panico', [
        'id_cliente' => Str::uuid()->toString(),
        'latitud' => -0.1807,
        'longitud' => -78.4678,
        'creada_en' => now()->toIso8601String(),
    ])->assertCreated();

    Event::assertDispatched(AlertaPanicoActualizada::class);
});

it('el líder de la comunidad puede autorizar el canal privado de alertas', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadParaBroadcast($lider);

    $this->actingAs($lider)
        ->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-comunidad.{$comunidad->id}.alertas-panico",
        ])
        ->assertOk();
});

it('un miembro activo de la comunidad puede autorizar el canal, uno ajeno no', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadParaBroadcast($lider);
    $miembro = User::factory()->create();
    $ajeno = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($miembro)
        ->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-comunidad.{$comunidad->id}.alertas-panico",
        ])
        ->assertOk();

    $this->actingAs($ajeno)
        ->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-comunidad.{$comunidad->id}.alertas-panico",
        ])
        ->assertForbidden();
});

it('no se puede autorizar el canal sin autenticación', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadParaBroadcast($lider);

    $this->postJson('/broadcasting/auth', [
        'socket_id' => '1234.5678',
        'channel_name' => "private-comunidad.{$comunidad->id}.alertas-panico",
    ])->assertUnauthorized();
});
