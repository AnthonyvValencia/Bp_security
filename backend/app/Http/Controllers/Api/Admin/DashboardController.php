<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Audit\Models\Auditoria;
use App\Domain\Communities\Enums\EstadoComunidad;
use App\Domain\Communities\Enums\EstadoSolicitud;
use App\Domain\Communities\Enums\TipoSolicitud;
use App\Domain\Users\Enums\EstadoUsuario;
use App\Domain\Users\Enums\RolUsuario;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditoriaResource;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\Reporte;
use App\Models\SolicitudMembresia;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function resumen(): JsonResponse
    {
        $auditoria = Auditoria::with('usuario:id,nombres,apellidos')
            ->latest()
            ->limit(15)
            ->get();

        return response()->json([
            'resumen' => [
                'usuarios' => [
                    'total' => User::count(),
                    'suspendidos' => User::where('estado', EstadoUsuario::Suspendido)->count(),
                    'administradores' => User::where('rol', RolUsuario::Administrador)->count(),
                    'lideres' => User::where('rol', RolUsuario::Lider)->count(),
                    'ciudadanos' => User::where('rol', RolUsuario::Ciudadano)->count(),
                ],
                'comunidades' => [
                    'activas' => Comunidad::where('estado', EstadoComunidad::Aprobada)->count(),
                    'suspendidas' => Comunidad::where('estado', EstadoComunidad::Suspendida)->count(),
                    'pendientes' => SolicitudMembresia::where('tipo', TipoSolicitud::Crear)
                        ->where('estado', EstadoSolicitud::Pendiente)
                        ->count(),
                ],
                'actividad' => [
                    'alertas' => AlertaPanico::count(),
                    'reportes' => Reporte::count(),
                ],
                'auditoria_reciente' => AuditoriaResource::collection($auditoria),
            ],
        ]);
    }
}
