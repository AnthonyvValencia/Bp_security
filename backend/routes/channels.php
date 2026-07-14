<?php

use App\Domain\Users\Enums\RolUsuario;
use App\Models\Comunidad;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Solicitudes de creación de comunidad: solo administradores.
Broadcast::channel('admin.solicitudes', function (User $usuario) {
    return $usuario->rol === RolUsuario::Administrador;
});

// Panel del administrador (métricas y actividad): solo administradores.
Broadcast::channel('admin.panel', function (User $usuario) {
    return $usuario->rol === RolUsuario::Administrador;
});

// Catálogo público de comunidades: cualquier usuario autenticado lo ve, así
// que cualquiera puede suscribirse para refrescar la lista al instante.
Broadcast::channel('comunidades', fn (User $usuario) => true);

// Canal de "ciclo de vida" de la comunidad (suspendida/reactivada/eliminada).
Broadcast::channel('comunidad.{comunidad}', function (User $usuario, Comunidad $comunidad) {
    return Gate::forUser($usuario)->allows('verMiembros', $comunidad);
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
