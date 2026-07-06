<?php

use App\Domain\Users\Enums\RolUsuario;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

it('permite a un ciudadano actualizar solo su propio perfil', function () {
    $usuario = User::factory()->create();
    $otro = User::factory()->create();

    $this->actingAs($usuario);

    expect(Gate::allows('update', $usuario))->toBeTrue();
    expect(Gate::allows('update', $otro))->toBeFalse();
});

it('el administrador tiene acceso total vía Gate::before', function () {
    $admin = User::factory()->create(['rol' => RolUsuario::Administrador]);
    $otro = User::factory()->create();

    $this->actingAs($admin);

    expect(Gate::allows('update', $otro))->toBeTrue();
});
