<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Communities\Services\ComunidadService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communities\CambiarLiderRequest;
use App\Http\Requests\Communities\RevisarSolicitudRequest;
use App\Http\Resources\ComunidadResource;
use App\Http\Resources\SolicitudMembresiaResource;
use App\Models\Comunidad;
use App\Models\SolicitudMembresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityApprovalController extends Controller
{
    public function __construct(
        private readonly ComunidadService $comunidadService,
    ) {}

    public function pendientes(): JsonResponse
    {
        $solicitudes = $this->comunidadService->listarPendientesAprobacion();

        return response()->json(['solicitudes' => SolicitudMembresiaResource::collection($solicitudes)]);
    }

    public function aprobar(Request $request, SolicitudMembresia $solicitud): JsonResponse
    {
        $comunidad = $this->comunidadService->aprobarCreacion($solicitud, $request->user());

        return response()->json(['comunidad' => new ComunidadResource($comunidad)]);
    }

    public function rechazar(RevisarSolicitudRequest $request, SolicitudMembresia $solicitud): JsonResponse
    {
        $this->comunidadService->rechazarCreacion($solicitud, $request->user(), $request->validated('motivo'));

        return response()->json(['mensaje' => 'Solicitud rechazada.']);
    }

    public function gestionables(): JsonResponse
    {
        $comunidades = $this->comunidadService->listarGestionables();

        return response()->json(['comunidades' => ComunidadResource::collection($comunidades)]);
    }

    public function suspender(Request $request, Comunidad $comunidad): JsonResponse
    {
        $comunidad = $this->comunidadService->suspender($comunidad, $request->user());

        return response()->json(['comunidad' => new ComunidadResource($comunidad)]);
    }

    public function reactivar(Request $request, Comunidad $comunidad): JsonResponse
    {
        $comunidad = $this->comunidadService->reactivar($comunidad, $request->user());

        return response()->json(['comunidad' => new ComunidadResource($comunidad)]);
    }

    public function eliminar(Request $request, Comunidad $comunidad): JsonResponse
    {
        $this->comunidadService->eliminar($comunidad, $request->user());

        return response()->json(['mensaje' => 'Comunidad eliminada.']);
    }

    public function cambiarLider(CambiarLiderRequest $request, Comunidad $comunidad): JsonResponse
    {
        $comunidad = $this->comunidadService->cambiarLider(
            $comunidad,
            (int) $request->validated('nuevo_lider_id'),
            $request->user(),
        );

        return response()->json(['comunidad' => new ComunidadResource($comunidad)]);
    }
}
