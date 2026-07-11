<?php

use App\Domain\Chat\Events\MensajeChatEnviado;
use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Domain\Users\Enums\RolUsuario;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\MensajeChat;
use App\Models\User;
use Illuminate\Support\Facades\Event;

function comunidadConMiembro(User $lider, User $miembro): Comunidad
{
    $comunidad = Comunidad::create([
        'nombre' => 'Comunidad Chat',
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    return $comunidad;
}

it('un miembro activo envía un mensaje y dispara el broadcast', function () {
    Event::fake([MensajeChatEnviado::class]);

    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $miembro = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $miembro);

    $this->actingAs($miembro)
        ->postJson("/api/comunidades/{$comunidad->id}/chat", ['contenido' => 'Hola vecinos'])
        ->assertCreated()
        ->assertJsonPath('mensaje.contenido', 'Hola vecinos')
        ->assertJsonPath('mensaje.usuario.id', $miembro->id);

    Event::assertDispatched(MensajeChatEnviado::class);
});

it('el contenido del mensaje es obligatorio', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $miembro = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $miembro);

    $this->actingAs($miembro)
        ->postJson("/api/comunidades/{$comunidad->id}/chat", ['contenido' => ''])
        ->assertStatus(422);
});

it('un usuario que no es miembro no puede ver ni escribir en el chat', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $miembro = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $miembro);
    $ajeno = User::factory()->create();

    $this->actingAs($ajeno)
        ->getJson("/api/comunidades/{$comunidad->id}/chat")
        ->assertForbidden();

    $this->actingAs($ajeno)
        ->postJson("/api/comunidades/{$comunidad->id}/chat", ['contenido' => 'Intruso'])
        ->assertForbidden();
});

it('lista los mensajes en orden cronológico', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $miembro = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $miembro);

    $antiguo = MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'contenido' => 'Primero',
    ]);
    $antiguo->forceFill(['created_at' => now()->subMinutes(5)])->save();

    $reciente = MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'contenido' => 'Segundo',
    ]);

    $this->actingAs($miembro)
        ->getJson("/api/comunidades/{$comunidad->id}/chat")
        ->assertOk()
        ->assertJsonCount(2, 'mensajes')
        ->assertJsonPath('mensajes.0.id', $antiguo->id)
        ->assertJsonPath('mensajes.1.id', $reciente->id);
});

it('el líder modera (elimina) cualquier mensaje de su comunidad', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $miembro = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $miembro);

    $mensaje = MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'contenido' => 'Mensaje inapropiado',
    ]);

    $this->actingAs($lider)
        ->deleteJson("/api/chat/mensajes/{$mensaje->id}")
        ->assertOk();

    expect(MensajeChat::find($mensaje->id))->toBeNull();
    expect(MensajeChat::withTrashed()->find($mensaje->id))->not->toBeNull();
});

it('el autor puede eliminar su propio mensaje, pero otro miembro no', function () {
    $lider = User::factory()->create(['rol' => RolUsuario::Lider]);
    $autor = User::factory()->create();
    $comunidad = comunidadConMiembro($lider, $autor);

    $otroMiembro = User::factory()->create();
    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $otroMiembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    $mensaje = MensajeChat::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $autor->id,
        'contenido' => 'Mi mensaje',
    ]);

    $this->actingAs($otroMiembro)
        ->deleteJson("/api/chat/mensajes/{$mensaje->id}")
        ->assertForbidden();

    $this->actingAs($autor)
        ->deleteJson("/api/chat/mensajes/{$mensaje->id}")
        ->assertOk();
});
