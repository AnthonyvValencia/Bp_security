<?php

use App\Http\Controllers\Api\Admin\CommunityApprovalController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Communities\CommunityController;
use App\Http\Controllers\Api\Communities\MembershipController;
use App\Http\Controllers\Api\Users\EmergencyContactController;
use App\Http\Controllers\Api\Users\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('registro', [AuthController::class, 'registrar']);
    Route::post('login', [AuthController::class, 'iniciarSesion'])->middleware('throttle:login');
    Route::post('olvide-contrasena', [AuthController::class, 'olvideContrasena']);
    Route::post('restablecer-contrasena', [AuthController::class, 'restablecerContrasena']);

    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'cerrarSesion']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('perfil', [ProfileController::class, 'mostrar']);
    Route::patch('perfil', [ProfileController::class, 'actualizar']);

    Route::get('contactos-emergencia', [EmergencyContactController::class, 'index']);
    Route::post('contactos-emergencia', [EmergencyContactController::class, 'guardar']);
    Route::patch('contactos-emergencia/{contacto}', [EmergencyContactController::class, 'actualizar']);
    Route::delete('contactos-emergencia/{contacto}', [EmergencyContactController::class, 'eliminar']);

    Route::get('comunidades', [CommunityController::class, 'index']);
    Route::post('comunidades', [CommunityController::class, 'solicitarCreacion']);
    Route::get('mi-comunidad', [CommunityController::class, 'miComunidad']);
    Route::get('comunidades/{comunidad}', [CommunityController::class, 'show']);

    Route::post('comunidades/{comunidad}/solicitudes', [MembershipController::class, 'solicitarIngreso']);
    Route::get('comunidades/{comunidad}/solicitudes', [MembershipController::class, 'solicitudesPendientes']);
    Route::post('solicitudes-membresia/{solicitud}/aprobar', [MembershipController::class, 'aprobar']);
    Route::post('solicitudes-membresia/{solicitud}/rechazar', [MembershipController::class, 'rechazar']);
    Route::get('comunidades/{comunidad}/miembros', [MembershipController::class, 'miembros']);
    Route::delete('comunidades/{comunidad}/miembros/{miembro}', [MembershipController::class, 'expulsar']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('comunidades/pendientes', [CommunityApprovalController::class, 'pendientes']);
        Route::post('comunidades/solicitudes/{solicitud}/aprobar', [CommunityApprovalController::class, 'aprobar']);
        Route::post('comunidades/solicitudes/{solicitud}/rechazar', [CommunityApprovalController::class, 'rechazar']);
    });
});
