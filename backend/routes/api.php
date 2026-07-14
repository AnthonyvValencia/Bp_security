<?php

use App\Http\Controllers\Api\Admin\CommunityApprovalController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Chat\ChatController;
use App\Http\Controllers\Api\Communities\CommunityController;
use App\Http\Controllers\Api\Communities\MembershipController;
use App\Http\Controllers\Api\Communities\MuroController;
use App\Http\Controllers\Api\Panic\PanicAlertController;
use App\Http\Controllers\Api\Reports\ReportController;
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
    Route::post('mi-comunidad/salir', [MembershipController::class, 'salir']);
    Route::get('comunidades/{comunidad}', [CommunityController::class, 'show']);

    Route::post('comunidades/{comunidad}/solicitudes', [MembershipController::class, 'solicitarIngreso']);
    Route::get('comunidades/{comunidad}/solicitudes', [MembershipController::class, 'solicitudesPendientes']);
    Route::post('solicitudes-membresia/{solicitud}/aprobar', [MembershipController::class, 'aprobar']);
    Route::post('solicitudes-membresia/{solicitud}/rechazar', [MembershipController::class, 'rechazar']);
    Route::get('comunidades/{comunidad}/miembros', [MembershipController::class, 'miembros']);
    Route::delete('comunidades/{comunidad}/miembros/{miembro}', [MembershipController::class, 'expulsar']);
    Route::get('comunidades/{comunidad}/muro', [MuroController::class, 'index']);

    Route::post('alertas-panico', [PanicAlertController::class, 'activar'])->middleware('throttle:panic');
    Route::get('alertas-panico', [PanicAlertController::class, 'propias']);
    Route::get('comunidades/{comunidad}/alertas-panico', [PanicAlertController::class, 'porComunidad']);
    Route::patch('alertas-panico/{alerta}/reconocer', [PanicAlertController::class, 'reconocer']);
    Route::patch('alertas-panico/{alerta}/resolver', [PanicAlertController::class, 'resolver']);
    Route::patch('alertas-panico/{alerta}/falsa-alarma', [PanicAlertController::class, 'falsaAlarma']);
    Route::patch('alertas-panico/{alerta}/cancelar', [PanicAlertController::class, 'cancelar']);
    Route::delete('alertas-panico/{alerta}', [PanicAlertController::class, 'eliminar']);

    Route::post('reportes', [ReportController::class, 'crear'])->middleware('throttle:reports');
    Route::get('reportes', [ReportController::class, 'propios']);
    Route::get('reportes/{reporte}', [ReportController::class, 'detalle']);
    Route::patch('reportes/{reporte}/estado', [ReportController::class, 'cambiarEstado']);
    Route::delete('reportes/{reporte}', [ReportController::class, 'eliminar']);
    Route::get('comunidades/{comunidad}/reportes', [ReportController::class, 'porComunidad']);

    Route::get('comunidades/{comunidad}/chat', [ChatController::class, 'index']);
    Route::post('comunidades/{comunidad}/chat', [ChatController::class, 'enviar'])->middleware('throttle:chat');
    Route::delete('chat/mensajes/{mensaje}', [ChatController::class, 'eliminar']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('comunidades/pendientes', [CommunityApprovalController::class, 'pendientes']);
        Route::post('comunidades/solicitudes/{solicitud}/aprobar', [CommunityApprovalController::class, 'aprobar']);
        Route::post('comunidades/solicitudes/{solicitud}/rechazar', [CommunityApprovalController::class, 'rechazar']);
        Route::get('comunidades', [CommunityApprovalController::class, 'gestionables']);
        Route::post('comunidades/{comunidad}/suspender', [CommunityApprovalController::class, 'suspender']);
        Route::post('comunidades/{comunidad}/reactivar', [CommunityApprovalController::class, 'reactivar']);
        Route::delete('comunidades/{comunidad}', [CommunityApprovalController::class, 'eliminar']);
        Route::post('comunidades/{comunidad}/cambiar-lider', [CommunityApprovalController::class, 'cambiarLider']);
        Route::get('alertas-panico/sin-comunidad', [PanicAlertController::class, 'sinComunidad']);

        Route::get('dashboard', [DashboardController::class, 'resumen']);
        Route::get('usuarios', [UserManagementController::class, 'index']);
        Route::get('usuarios/{usuario}', [UserManagementController::class, 'show']);
        Route::post('usuarios/{usuario}/suspender', [UserManagementController::class, 'suspender']);
        Route::post('usuarios/{usuario}/reactivar', [UserManagementController::class, 'reactivar']);
        Route::post('usuarios/{usuario}/rol', [UserManagementController::class, 'cambiarRol']);
    });
});
