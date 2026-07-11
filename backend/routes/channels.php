<?php

use App\Models\Comunidad;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('comunidad.{comunidad}.alertas-panico', function (User $usuario, Comunidad $comunidad) {
    return Gate::forUser($usuario)->allows('verMiembros', $comunidad);
});

Broadcast::channel('comunidad.{comunidad}.chat', function (User $usuario, Comunidad $comunidad) {
    return Gate::forUser($usuario)->allows('verMiembros', $comunidad);
});

Broadcast::channel('comunidad.{comunidad}.reportes', function (User $usuario, Comunidad $comunidad) {
    return Gate::forUser($usuario)->allows('verMiembros', $comunidad);
});
