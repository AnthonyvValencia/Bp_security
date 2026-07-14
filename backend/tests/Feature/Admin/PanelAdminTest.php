<?php

use App\Domain\Audit\Events\PanelAdminActualizado;
use App\Domain\Users\Enums\EstadoUsuario;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\User;
use Illuminate\Support\Facades\Event;

function admin(): User
{
    return User::factory()->create(['rol' => RolUsuario::Administrador]);
}

it('bloquea el inicio de sesión de un usuario suspendido', function () {
    $usuario = User::factory()->create([
        'email' => 'suspendido@bp.test',
        'password' => 'password123',
        'estado' => EstadoUsuario::Suspendido,
    ]);

    $this->postJson('/api/auth/login', [
        'email' => $usuario->email,
        'password' => 'password123',
    ])->assertStatus(403)->assertJsonPath('message', 'Tu cuenta se encuentra suspendida. Contacta al administrador.');
});

it('un usuario activo sí puede iniciar sesión', function () {
    $usuario = User::factory()->create([
        'email' => 'activo@bp.test',
        'password' => 'password123',
    ]);

    $this->postJson('/api/auth/login', [
        'email' => $usuario->email,
        'password' => 'password123',
    ])->assertOk()->assertJsonStructure(['token']);
});

it('un usuario que no es admin no puede acceder al panel', function () {
    $ciudadano = User::factory()->create();

    $this->actingAs($ciudadano)->getJson('/api/admin/dashboard')->assertForbidden();
    $this->actingAs($ciudadano)->getJson('/api/admin/usuarios')->assertForbidden();
});

it('el admin puede listar y buscar usuarios', function () {
    $admin = admin();
    User::factory()->create(['nombres' => 'Zoraida', 'apellidos' => 'Perez']);

    $todos = $this->actingAs($admin)->getJson('/api/admin/usuarios')->assertOk()->json('usuarios');
    expect(count($todos))->toBeGreaterThanOrEqual(2);

    $filtrados = $this->actingAs($admin)->getJson('/api/admin/usuarios?q=Zoraida')->assertOk()->json('usuarios');
    expect($filtrados)->toHaveCount(1)->and($filtrados[0]['nombres'])->toBe('Zoraida');
});

it('la vista de usuarios no expone datos médicos', function () {
    $admin = admin();
    $usuario = User::factory()->create();

    $datos = $this->actingAs($admin)->getJson("/api/admin/usuarios/{$usuario->id}")->assertOk()->json('usuario');

    expect($datos)->not->toHaveKey('tipo_sangre')
        ->and($datos)->not->toHaveKey('condiciones_medicas')
        ->and($datos)->toHaveKey('cedula');
});

it('el admin suspende a un usuario y le revoca las sesiones activas', function () {
    $admin = admin();
    $usuario = User::factory()->create();
    $token = $usuario->createToken('mobile')->plainTextToken;

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$usuario->id}/suspender")
        ->assertOk()
        ->assertJsonPath('usuario.estado', 'suspendido');

    expect($usuario->fresh()->estado)->toBe(EstadoUsuario::Suspendido);

    // La sesión fue revocada: ya no le queda ningún token válido.
    expect($usuario->tokens()->count())->toBe(0);
    expect($token)->not->toBeEmpty();
});

it('el admin no puede suspenderse a sí mismo', function () {
    $admin = admin();

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$admin->id}/suspender")
        ->assertStatus(422);

    expect($admin->fresh()->estado)->toBe(EstadoUsuario::Activo);
});

it('el admin reactiva a un usuario suspendido', function () {
    $admin = admin();
    $usuario = User::factory()->create(['estado' => EstadoUsuario::Suspendido]);

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$usuario->id}/reactivar")
        ->assertOk()
        ->assertJsonPath('usuario.estado', 'activo');
});

it('el admin puede promover a un usuario a administrador', function () {
    $admin = admin();
    $usuario = User::factory()->create(['rol' => RolUsuario::Ciudadano]);

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$usuario->id}/rol", ['rol' => 'administrador'])
        ->assertOk()
        ->assertJsonPath('usuario.rol', 'administrador');

    expect($usuario->fresh()->rol)->toBe(RolUsuario::Administrador);
});

it('el admin no puede cambiar su propio rol', function () {
    $admin = admin();

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$admin->id}/rol", ['rol' => 'ciudadano'])
        ->assertStatus(422);

    expect($admin->fresh()->rol)->toBe(RolUsuario::Administrador);
});

it('rechaza un rol no permitido', function () {
    $admin = admin();
    $usuario = User::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$usuario->id}/rol", ['rol' => 'lider'])
        ->assertStatus(422);
});

it('cualquier acción auditada avisa al panel del admin en tiempo real', function () {
    Event::fake([PanelAdminActualizado::class]);

    // Un registro (acción auditada) debe refrescar el panel...
    $this->postJson('/api/auth/registro', [
        'nombres' => 'Nueva',
        'apellidos' => 'Vecina',
        'cedula' => '1712345678',
        'email' => 'nueva@bp.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'telefono' => '0999999999',
        'direccion' => 'Calle 1',
        'barrio' => 'Centro',
        'numero_casa' => 'A-12',
    ])->assertCreated();

    Event::assertDispatched(PanelAdminActualizado::class);
});

it('suspender a un usuario también avisa al panel del admin', function () {
    Event::fake([PanelAdminActualizado::class]);

    $admin = admin();
    $usuario = User::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/admin/usuarios/{$usuario->id}/suspender")
        ->assertOk();

    Event::assertDispatched(PanelAdminActualizado::class);
});

it('el canal del panel solo autoriza a administradores', function () {
    config(['broadcasting.default' => 'reverb']);
    require base_path('routes/channels.php');

    $admin = admin();
    $ciudadano = User::factory()->create();

    $this->actingAs($admin)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-admin.panel',
            'socket_id' => '1234.5678',
        ])
        ->assertOk();

    $this->actingAs($ciudadano)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-admin.panel',
            'socket_id' => '1234.5678',
        ])
        ->assertForbidden();
});

it('el dashboard devuelve el resumen con las métricas y la auditoría', function () {
    $admin = admin();
    User::factory()->count(3)->create();

    $resumen = $this->actingAs($admin)->getJson('/api/admin/dashboard')->assertOk()->json('resumen');

    expect($resumen)->toHaveKeys(['usuarios', 'comunidades', 'actividad', 'auditoria_reciente'])
        ->and($resumen['usuarios'])->toHaveKeys(['total', 'suspendidos', 'administradores', 'lideres', 'ciudadanos'])
        ->and($resumen['comunidades'])->toHaveKeys(['activas', 'suspendidas', 'pendientes']);
});
