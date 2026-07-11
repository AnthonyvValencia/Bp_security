<?php

use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoMiembro;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\Reporte;
use App\Models\User;
use Illuminate\Support\Str;

function crearComunidadParaMuro(User $lider): Comunidad
{
    return Comunidad::create([
        'nombre' => 'Comunidad Muro',
        'barrio' => 'Barrio Test',
        'lider_id' => $lider->id,
        'estado' => EstadoComunidad::Aprobada,
    ]);
}

it('un miembro activo ve el muro de incidencias de su comunidad', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadParaMuro($lider);
    $miembro = User::factory()->create();

    ComunidadMiembro::create([
        'comunidad_id' => $comunidad->id,
        'usuario_id' => $miembro->id,
        'estado' => EstadoMiembro::Activo,
    ]);

    AlertaPanico::create([
        'usuario_id' => $miembro->id,
        'comunidad_id' => $comunidad->id,
        'id_cliente' => Str::uuid()->toString(),
        'estado' => 'enviada',
        'creada_en' => now(),
    ]);

    Reporte::create([
        'usuario_id' => $miembro->id,
        'comunidad_id' => $comunidad->id,
        'titulo' => 'Luz dañada',
        'descripcion' => 'La luz de la esquina no enciende.',
        'categoria' => 'luz_daniada',
        'estado' => 'abierto',
    ]);

    $respuesta = $this->actingAs($miembro)
        ->getJson("/api/comunidades/{$comunidad->id}/muro")
        ->assertOk();

    expect($respuesta->json('muro'))->toHaveCount(2);

    $reporteEnMuro = collect($respuesta->json('muro'))->firstWhere('tipo', 'reporte');
    expect($reporteEnMuro['descripcion'])->toBe('La luz de la esquina no enciende.');
});

it('un usuario ajeno a la comunidad no puede ver su muro de incidencias', function () {
    $lider = User::factory()->create();
    $comunidad = crearComunidadParaMuro($lider);
    $extrano = User::factory()->create();

    $this->actingAs($extrano)
        ->getJson("/api/comunidades/{$comunidad->id}/muro")
        ->assertForbidden();
});
