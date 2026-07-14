<?php

namespace App\Http\Controllers\Api\Communities;

use App\Domain\Communities\Services\MembresiaService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communities\RevisarSolicitudRequest;
use App\Http\Resources\ComunidadMiembroResource;
use App\Http\Resources\SolicitudMembresiaResource;
use App\Models\Comunidad;
use App\Models\ComunidadMiembro;
use App\Models\SolicitudMembresia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function __construct(
        private readonly MembresiaService $membresiaService,
    ) {}

    public function solicitarIngreso(Request $request, Comunidad $comunidad): JsonResponse
    {
        $solicitud = $this->membresiaService->solicitarIngreso($request->user(), $comunidad);

        return response()->json(['solicitud' => new SolicitudMembresiaResource($solicitud)], 201);
    }

    public function salir(Request $request): JsonResponse
    {
        $this->membresiaService->salir($request->user());

        return response()->json(['mensaje' => 'Saliste de la comunidad.']);
    }

    public function solicitudesPendientes(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('gestionar', $comunidad);

        $solicitudes = $this->membresiaService->listarSolicitudesPendientes($comunidad);

        return response()->json(['solicitudes' => SolicitudMembresiaResource::collection($solicitudes)]);
    }

    public function aprobar(Request $request, SolicitudMembresia $solicitud): JsonResponse
    {
        $this->authorize('gestionar', $solicitud->comunidad);

        $miembro = $this->membresiaService->aprobarIngreso($solicitud, $request->user());

        return response()->json(['miembro' => new ComunidadMiembroResource($miembro->load('usuario'))]);
    }

    public function rechazar(RevisarSolicitudRequest $request, SolicitudMembresia $solicitud): JsonResponse
    {
        $this->authorize('gestionar', $solicitud->comunidad);

        $this->membresiaService->rechazarIngreso($solicitud, $request->user(), $request->validated('motivo'));

        return response()->json(['mensaje' => 'Solicitud rechazada.']);
    }

    public function miembros(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('verMiembros', $comunidad);

        $miembros = $this->membresiaService->listarMiembros($comunidad);

        return response()->json(['miembros' => ComunidadMiembroResource::collection($miembros)]);
    }

    public function expulsar(Request $request, Comunidad $comunidad, ComunidadMiembro $miembro): JsonResponse
    {
        $this->authorize('gestionar', $comunidad);

        abort_if($miembro->comunidad_id !== $comunidad->id, 404);

        $this->membresiaService->expulsarMiembro($miembro, $request->user());

        return response()->json(['mensaje' => 'Miembro expulsado.']);
    }
}
