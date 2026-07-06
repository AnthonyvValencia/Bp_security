<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Communities\Services\ComunidadService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communities\RevisarSolicitudRequest;
use App\Http\Resources\ComunidadResource;
use App\Http\Resources\SolicitudMembresiaResource;
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
}
