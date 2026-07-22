<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Enums\TipoSolicitud;
use App\Domain\Panic\Enums\EstadoAlerta;
use App\Domain\Reports\Enums\EstadoReporte;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\MensajeChat;
use App\Models\Reporte;
use App\Models\SolicitudMembresia;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Crea una comunidad aprobada con su líder y devuelve [comunidad, lider].
 *
 * @return array{0: Comunidad, 1: User}
 */
function comunidadConLiderResumen(): array
{
    $lider = User::factory()->create();
    $comunidad = Comunidad::create([
        'nombre' => 'Comunidad Resumen',
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $lider->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    return [$comunidad, $lider];
}

function agregarMiembroResumen(Comunidad $comunidad): User
{
    $miembro = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    return $miembro;
}

function crearAlertaResumen(Comunidad $comunidad, User $usuario, EstadoAlerta $estado): void
{
    AlertaPanico::create([
        'usuario_id' => $usuario->id,
        'comunidad_id' => $comunidad->id,
        'id_cliente' => Str::uuid()->toString(),
        'estado' => $estado,
        'creada_en' => now(),
    ]);
}

function crearReporteResumen(Comunidad $comunidad, User $usuario, EstadoReporte $estado): void
{
    Reporte::create([
        'usuario_id' => $usuario->id,
        'comunidad_id' => $comunidad->id,
        'titulo' => 'Novedad de prueba',
        'descripcion' => 'Descripcion de prueba para el resumen.',
        'categoria' => 'otro',
        'estado' => $estado,
    ]);
}

it('un usuario sin comunidad no tiene nada pendiente', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.solicitudes_ingreso', 0)
        ->assertJsonPath('resumen.alertas_abiertas', 0)
        ->assertJsonPath('resumen.reportes_abiertos', 0)
        ->assertJsonPath('resumen.chat_no_leidos', 0);
});

it('el líder ve las solicitudes de ingreso pendientes de su comunidad', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();

    SolicitudMembresia::create([
        'usuario_id' => User::factory()->create()->id,
        'comunidad_id' => $comunidad->id,
        'tipo' => TipoSolicitud::Unirse,
    ]);

    $this->actingAs($lider)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.solicitudes_ingreso', 1);
});

it('el líder ve las alertas abiertas y los reportes sin atender', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();
    $vecino = agregarMiembroResumen($comunidad);

    crearAlertaResumen($comunidad, $vecino, EstadoAlerta::Enviada);
    // Una ya resuelta no debe contar.
    crearAlertaResumen($comunidad, $vecino, EstadoAlerta::Resuelta);

    crearReporteResumen($comunidad, $vecino, EstadoReporte::Abierto);
    crearReporteResumen($comunidad, $vecino, EstadoReporte::Descartado);

    $this->actingAs($lider)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.alertas_abiertas', 1)
        ->assertJsonPath('resumen.reportes_abiertos', 1);
});

it('un miembro que no es líder no ve contadores de gestión', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();
    $vecino = agregarMiembroResumen($comunidad);

    SolicitudMembresia::create([
        'usuario_id' => User::factory()->create()->id,
        'comunidad_id' => $comunidad->id,
        'tipo' => TipoSolicitud::Unirse,
    ]);
    crearAlertaResumen($comunidad, $lider, EstadoAlerta::Enviada);

    $this->actingAs($vecino)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.solicitudes_ingreso', 0)
        ->assertJsonPath('resumen.alertas_abiertas', 0);
});

it('cuenta los mensajes ajenos del chat y nunca los propios', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();
    $vecino = agregarMiembroResumen($comunidad);

    MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $vecino->id,
        'contenido' => 'Hola vecinos',
    ]);
    MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $lider->id,
        'contenido' => 'Mensaje propio, no debe contarse',
    ]);

    $this->actingAs($lider)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.chat_no_leidos', 1);
});

it('al marcar el chat como leído el contador vuelve a cero', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();
    $vecino = agregarMiembroResumen($comunidad);

    MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $vecino->id,
        'contenido' => 'Hola',
    ]);

    $this->actingAs($lider)
        ->postJson("/api/comunidades/{$comunidad->id}/chat/leido")
        ->assertOk();

    $this->actingAs($lider)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.chat_no_leidos', 0);
});

it('un mensaje posterior a la lectura vuelve a contar', function () {
    [$comunidad, $lider] = comunidadConLiderResumen();
    $vecino = agregarMiembroResumen($comunidad);

    $this->actingAs($lider)
        ->postJson("/api/comunidades/{$comunidad->id}/chat/leido")
        ->assertOk();

    // Sin avanzar el reloj a propósito: el corte es por id de mensaje, así que
    // debe contarse aunque nazca en el mismo segundo que la lectura.
    MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $vecino->id,
        'contenido' => 'Mensaje nuevo tras la lectura',
    ]);

    $this->actingAs($lider)
        ->getJson('/api/resumen-notificaciones')
        ->assertOk()
        ->assertJsonPath('resumen.chat_no_leidos', 1);
});

it('un ajeno a la comunidad no puede marcar su chat como leído', function () {
    [$comunidad] = comunidadConLiderResumen();
    $ajeno = User::factory()->create();

    $this->actingAs($ajeno)
        ->postJson("/api/comunidades/{$comunidad->id}/chat/leido")
        ->assertForbidden();
});

it('el resumen exige autenticación', function () {
    $this->getJson('/api/resumen-notificaciones')->assertUnauthorized();
});
