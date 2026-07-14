<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Communities\Events\ComunidadActualizada;
use App\Domain\Communities\Events\MembresiaActualizada;
use App\Domain\Communities\Events\SolicitudRecibida;
use App\Domain\Reports\Enums\CategoriaReporte;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\SolicitudMembresia;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

function comunidadAprobada(?User $lider = null): Comunidad
{
    $lider ??= User::factory()->create();

    return Comunidad::create([
        'nombre' => 'Comunidad '.uniqid(),
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

it('lista solo las comunidades gestionables (aprobadas y suspendidas)', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    Comunidad::create(['nombre' => 'Activa', 'barrio' => 'B', 'estado' => EstadoComunidad::Aprobada]);
    Comunidad::create(['nombre' => 'Suspendida', 'barrio' => 'B', 'estado' => EstadoComunidad::Suspendida]);
    Comunidad::create(['nombre' => 'Pendiente', 'barrio' => 'B', 'estado' => EstadoComunidad::Pendiente]);

    $respuesta = $this->actingAs($admin)->getJson('/api/admin/comunidades');

    $nombres = collect($respuesta->assertOk()->json('comunidades'))->pluck('nombre');
    expect($nombres)->toContain('Activa')->toContain('Suspendida')->not->toContain('Pendiente');
});

it('un usuario que no es admin no puede gestionar comunidades', function () {
    $ciudadano = User::factory()->create();
    $comunidad = comunidadAprobada();

    $this->actingAs($ciudadano)->getJson('/api/admin/comunidades')->assertForbidden();
    $this->actingAs($ciudadano)->postJson("/api/admin/comunidades/{$comunidad->id}/suspender")->assertForbidden();
    $this->actingAs($ciudadano)->deleteJson("/api/admin/comunidades/{$comunidad->id}")->assertForbidden();
});

it('el admin suspende y luego reactiva una comunidad', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/suspender")
        ->assertOk()
        ->assertJsonPath('comunidad.estado', 'suspendida');

    expect($comunidad->fresh()->estado)->toBe(EstadoComunidad::Suspendida);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/reactivar")
        ->assertOk()
        ->assertJsonPath('comunidad.estado', 'aprobada');

    expect($comunidad->fresh()->estado)->toBe(EstadoComunidad::Aprobada);
});

it('no se puede suspender una comunidad que no está aprobada', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();
    $comunidad->update(['estado' => EstadoComunidad::Suspendida]);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/suspender")
        ->assertStatus(422);
});

it('el admin elimina una comunidad (soft delete) y deja de listarse', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/comunidades/{$comunidad->id}")
        ->assertOk();

    expect(Comunidad::find($comunidad->id))->toBeNull();
    expect(Comunidad::withTrashed()->find($comunidad->id))->not->toBeNull();
    $this->actingAs($admin)->getJson('/api/admin/comunidades')
        ->assertJsonMissing(['id' => $comunidad->id]);
});

it('al eliminar una comunidad sus miembros pierden la membresía activa de inmediato', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $miembro = User::factory()->create();
    $comunidad = comunidadAprobada();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($admin)->deleteJson("/api/admin/comunidades/{$comunidad->id}")->assertOk();

    // Sin reiniciar nada: mi-comunidad ya es null...
    $this->actingAs($miembro)->getJson('/api/mi-comunidad')
        ->assertOk()
        ->assertJsonPath('comunidad', null);

    // ...reportar queda bloqueado...
    $this->actingAs($miembro)
        ->postJson('/api/reportes', [
            'titulo' => 'Prueba',
            'descripcion' => 'No debería pasar',
            'categoria' => CategoriaReporte::Otro->value,
        ])
        ->assertStatus(422);

    // ...y el chat/muro de esa comunidad ya no existen para la API.
    $this->actingAs($miembro)
        ->postJson("/api/comunidades/{$comunidad->id}/chat", ['contenido' => 'Hola'])
        ->assertNotFound();
    $this->actingAs($miembro)
        ->getJson("/api/comunidades/{$comunidad->id}/muro")
        ->assertNotFound();
});

it('suspender, reactivar y eliminar difunden el evento de comunidad actualizada', function () {
    Event::fake([ComunidadActualizada::class]);

    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();

    $this->actingAs($admin)->postJson("/api/admin/comunidades/{$comunidad->id}/suspender")->assertOk();
    Event::assertDispatched(ComunidadActualizada::class, fn ($evento) => $evento->comunidadId === $comunidad->id && $evento->estado === 'suspendida');

    $this->actingAs($admin)->postJson("/api/admin/comunidades/{$comunidad->id}/reactivar")->assertOk();
    Event::assertDispatched(ComunidadActualizada::class, fn ($evento) => $evento->comunidadId === $comunidad->id && $evento->estado === 'aprobada');

    $this->actingAs($admin)->deleteJson("/api/admin/comunidades/{$comunidad->id}")->assertOk();
    Event::assertDispatched(ComunidadActualizada::class, fn ($evento) => $evento->comunidadId === $comunidad->id && $evento->estado === 'eliminada');
});

it('el admin puede cambiar el líder a otro miembro activo; el saliente queda como miembro', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $liderActual = User::factory()->create();
    $comunidad = comunidadAprobada($liderActual);
    $nuevoLider = User::factory()->create();

    // Ambos son miembros activos de la comunidad.
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => $liderActual->id, 'estado' => EstadoMiembro::Activo]);
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => $nuevoLider->id, 'estado' => EstadoMiembro::Activo]);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/cambiar-lider", ['nuevo_lider_id' => $nuevoLider->id])
        ->assertOk()
        ->assertJsonPath('comunidad.lider.id', $nuevoLider->id);

    expect($comunidad->fresh()->lider_id)->toBe($nuevoLider->id);

    // El líder saliente conserva su membresía activa.
    $membresiaSaliente = ComunidadMiembro::where('comunidad_id', $comunidad->id)
        ->where('usuario_id', $liderActual->id)
        ->first();
    expect($membresiaSaliente->estado)->toBe(EstadoMiembro::Activo);
});

it('no se puede nombrar líder a alguien que no es miembro activo', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();
    $extrano = User::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/cambiar-lider", ['nuevo_lider_id' => $extrano->id])
        ->assertStatus(422);

    expect($comunidad->fresh()->lider_id)->not->toBe($extrano->id);
});

it('un usuario que no es admin no puede cambiar el líder', function () {
    $ciudadano = User::factory()->create();
    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    $miembro = User::factory()->create();
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => $miembro->id, 'estado' => EstadoMiembro::Activo]);

    $this->actingAs($ciudadano)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/cambiar-lider", ['nuevo_lider_id' => $miembro->id])
        ->assertForbidden();
});

it('cambiar el líder difunde el evento de comunidad actualizada', function () {
    Event::fake([ComunidadActualizada::class]);

    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();
    $nuevoLider = User::factory()->create();
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => $nuevoLider->id, 'estado' => EstadoMiembro::Activo]);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/{$comunidad->id}/cambiar-lider", ['nuevo_lider_id' => $nuevoLider->id])
        ->assertOk();

    Event::assertDispatched(
        ComunidadActualizada::class,
        fn ($evento) => $evento->comunidadId === $comunidad->id && $evento->estado === 'miembros_actualizados',
    );
});

it('aprobar la creación de una comunidad notifica al solicitante por su canal personal', function () {
    Event::fake([MembresiaActualizada::class]);

    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $solicitante = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'crear',
        'nombre_comunidad_propuesto' => 'Notificada',
        'barrio_comunidad_propuesto' => 'Barrio N',
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/comunidades/solicitudes/{$solicitud->id}/aprobar")
        ->assertOk();

    Event::assertDispatched(
        MembresiaActualizada::class,
        fn ($evento) => $evento->usuarioId === $solicitante->id
            && $evento->evento === 'comunidad_aprobada'
            && $evento->comunidadId !== null,
    );
});

it('aprobar un ingreso y expulsar a un miembro notifican al afectado por su canal personal', function () {
    Event::fake([MembresiaActualizada::class]);

    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    $solicitante = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $solicitante->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $this->actingAs($lider)
        ->postJson("/api/solicitudes-membresia/{$solicitud->id}/aprobar")
        ->assertOk();

    Event::assertDispatched(
        MembresiaActualizada::class,
        fn ($evento) => $evento->usuarioId === $solicitante->id && $evento->evento === 'ingreso_aprobado',
    );

    $miembro = ComunidadMiembro::where('comunidad_id', $comunidad->id)
        ->where('usuario_id', $solicitante->id)
        ->first();

    $this->actingAs($lider)
        ->deleteJson("/api/comunidades/{$comunidad->id}/miembros/{$miembro->id}")
        ->assertOk();

    Event::assertDispatched(
        MembresiaActualizada::class,
        fn ($evento) => $evento->usuarioId === $solicitante->id && $evento->evento === 'expulsado',
    );
});

it('solicitar crear una comunidad notifica a los administradores al instante', function () {
    Event::fake([SolicitudRecibida::class]);

    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)
        ->postJson('/api/comunidades', ['nombre' => 'Al Instante', 'barrio' => 'Barrio I'])
        ->assertCreated();

    Event::assertDispatched(
        SolicitudRecibida::class,
        fn ($evento) => $evento->solicitud->usuario_id === $ciudadano->id
            && $evento->broadcastOn()->name === 'private-admin.solicitudes',
    );
});

it('solicitar ingreso notifica al líder por su canal personal al instante', function () {
    Event::fake([SolicitudRecibida::class]);

    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    $vecino = User::factory()->create();

    $this->actingAs($vecino)
        ->postJson("/api/comunidades/{$comunidad->id}/solicitudes")
        ->assertCreated();

    Event::assertDispatched(
        SolicitudRecibida::class,
        fn ($evento) => $evento->solicitud->usuario_id === $vecino->id
            && $evento->broadcastOn()->name === "private-App.Models.User.{$lider->id}",
    );
});

it('el canal admin.solicitudes solo autoriza a administradores', function () {
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');

    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $ciudadano = User::factory()->create();

    $this->actingAs($admin)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-admin.solicitudes',
            'socket_id' => '1234.5678',
        ])
        ->assertOk();

    $this->actingAs($ciudadano)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-admin.solicitudes',
            'socket_id' => '1234.5678',
        ])
        ->assertForbidden();
});

it('una comunidad suspendida bloquea el envío de mensajes de chat', function () {
    $miembro = User::factory()->create();
    $comunidad = comunidadAprobada();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);
    $comunidad->update(['estado' => EstadoComunidad::Suspendida]);

    $this->actingAs($miembro)
        ->postJson("/api/comunidades/{$comunidad->id}/chat", ['contenido' => 'Hola'])
        ->assertStatus(422);
});

it('aprobar ingreso, expulsar y salir difunden miembros_actualizados a la comunidad', function () {
    Event::fake([ComunidadActualizada::class]);

    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    $vecino = User::factory()->create();
    $solicitud = SolicitudMembresia::create([
        'usuario_id' => $vecino->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $esMiembrosActualizados = fn ($evento) => $evento->comunidadId === $comunidad->id
        && $evento->estado === 'miembros_actualizados';

    $this->actingAs($lider)->postJson("/api/solicitudes-membresia/{$solicitud->id}/aprobar")->assertOk();
    Event::assertDispatchedTimes(ComunidadActualizada::class, 1);
    Event::assertDispatched(ComunidadActualizada::class, $esMiembrosActualizados);

    $this->actingAs($vecino)->postJson('/api/mi-comunidad/salir')->assertOk();
    Event::assertDispatchedTimes(ComunidadActualizada::class, 2);

    // Expulsión: se reingresa al vecino y el líder lo expulsa.
    $miembro = ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $vecino->id,
        'estado' => EstadoMiembro::Activo,
    ]);
    $this->actingAs($lider)
        ->deleteJson("/api/comunidades/{$comunidad->id}/miembros/{$miembro->id}")
        ->assertOk();
    Event::assertDispatchedTimes(ComunidadActualizada::class, 3);
});

it('el líder ve el perfil del solicitante sin exponer datos sensibles', function () {
    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    $vecino = User::factory()->create([
        'telefono' => '0999999999',
        'barrio' => 'Los Esteros',
        'direccion' => 'Calle 13 y Av. 8',
        'numero_casa' => 'Mz 4 Villa 7',
        'referencias_domicilio' => 'Frente al parque',
        'tipo_sangre' => 'O+',
        'condiciones_medicas' => 'Asma',
    ]);
    SolicitudMembresia::create([
        'usuario_id' => $vecino->id,
        'tipo' => 'unirse',
        'comunidad_id' => $comunidad->id,
    ]);

    $respuesta = $this->actingAs($lider)
        ->getJson("/api/comunidades/{$comunidad->id}/solicitudes")
        ->assertOk();

    $usuario = $respuesta->json('solicitudes.0.usuario');
    expect($usuario['telefono'])->toBe('0999999999')
        ->and($usuario['barrio'])->toBe('Los Esteros')
        ->and($usuario['direccion'])->toBe('Calle 13 y Av. 8')
        ->and($usuario['numero_casa'])->toBe('Mz 4 Villa 7')
        ->and($usuario['referencias_domicilio'])->toBe('Frente al parque')
        // Datos médicos y cédula son para emergencias, no para evaluar ingresos.
        ->and($usuario)->not->toHaveKey('tipo_sangre')
        ->and($usuario)->not->toHaveKey('condiciones_medicas')
        ->and($usuario)->not->toHaveKey('cedula');
});

it('el listado de miembros incluye el perfil de contacto sin datos sensibles', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $comunidad = comunidadAprobada();
    $vecino = User::factory()->create([
        'telefono' => '0988888888',
        'barrio' => 'Tarqui',
        'direccion' => 'Av. Principal 45',
        'numero_casa' => 'Casa 12',
        'referencias_domicilio' => 'Junto a la tienda',
        'tipo_sangre' => 'A-',
        'condiciones_medicas' => 'Diabetes',
    ]);
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $vecino->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $usuario = $this->actingAs($admin)
        ->getJson("/api/comunidades/{$comunidad->id}/miembros")
        ->assertOk()
        ->json('miembros.0.usuario');

    expect($usuario['telefono'])->toBe('0988888888')
        ->and($usuario['barrio'])->toBe('Tarqui')
        ->and($usuario['direccion'])->toBe('Av. Principal 45')
        ->and($usuario['referencias_domicilio'])->toBe('Junto a la tienda')
        ->and($usuario)->not->toHaveKey('tipo_sangre')
        ->and($usuario)->not->toHaveKey('condiciones_medicas')
        ->and($usuario)->not->toHaveKey('cedula');
});

it('el total de miembros no cuenta a los retirados ni expulsados', function () {
    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);

    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => $lider->id, 'estado' => EstadoMiembro::Activo]);
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => User::factory()->create()->id, 'estado' => EstadoMiembro::Activo]);
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => User::factory()->create()->id, 'estado' => EstadoMiembro::Retirado]);
    ComunidadMiembro::create(['comunidad_id' => $comunidad->id, 'usuario_id' => User::factory()->create()->id, 'estado' => EstadoMiembro::Expulsado]);

    $this->actingAs($lider)
        ->getJson("/api/comunidades/{$comunidad->id}")
        ->assertOk()
        ->assertJsonPath('comunidad.total_miembros', 2);
});

it('un miembro puede salir de su comunidad y queda libre para unirse a otra', function () {
    $miembro = User::factory()->create();
    $comunidad = comunidadAprobada();
    $membresia = ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($miembro)->postJson('/api/mi-comunidad/salir')->assertOk();

    expect($membresia->fresh()->estado)->toBe(EstadoMiembro::Retirado);
    $this->actingAs($miembro)->getJson('/api/mi-comunidad')
        ->assertOk()
        ->assertJsonPath('comunidad', null);

    // Libre para solicitar ingreso a otra comunidad.
    $otra = comunidadAprobada();
    $this->actingAs($miembro)
        ->postJson("/api/comunidades/{$otra->id}/solicitudes")
        ->assertCreated();
});

it('el líder no puede salir de su comunidad', function () {
    $lider = User::factory()->create();
    $comunidad = comunidadAprobada($lider);
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $lider->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $this->actingAs($lider)
        ->postJson('/api/mi-comunidad/salir')
        ->assertStatus(422);
});

it('salir sin comunidad activa devuelve error', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->postJson('/api/mi-comunidad/salir')->assertStatus(422);
});

it('una comunidad suspendida bloquea el botón de pánico con el mensaje de suspensión', function () {
    $miembro = User::factory()->create();
    $comunidad = comunidadAprobada();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);
    $comunidad->update(['estado' => EstadoComunidad::Suspendida]);

    $this->actingAs($miembro)
        ->postJson('/api/alertas-panico', [
            'id_cliente' => Str::uuid()->toString(),
            'latitud' => -0.95,
            'longitud' => -80.72,
            'creada_en' => now()->toIso8601String(),
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'La comunidad se encuentra suspendida.');

    // Un usuario sin comunidad sigue pudiendo alertar (la suspensión no
    // apaga el pánico para quien no pertenece a esa comunidad).
    $sinComunidad = User::factory()->create();
    $this->actingAs($sinComunidad)
        ->postJson('/api/alertas-panico', [
            'id_cliente' => Str::uuid()->toString(),
            'latitud' => -0.95,
            'longitud' => -80.72,
            'creada_en' => now()->toIso8601String(),
        ])
        ->assertCreated();
});

it('una comunidad suspendida bloquea la creación de reportes', function () {
    $miembro = User::factory()->create();
    $comunidad = comunidadAprobada();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);
    $comunidad->update(['estado' => EstadoComunidad::Suspendida]);

    $this->actingAs($miembro)
        ->postJson('/api/reportes', [
            'titulo' => 'Ruido',
            'descripcion' => 'Mucho ruido en la noche',
            'categoria' => CategoriaReporte::RuidosMolestos->value,
        ])
        ->assertStatus(422);
});
