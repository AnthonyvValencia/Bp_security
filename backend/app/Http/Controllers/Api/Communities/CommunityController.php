<?php

namespace App\Http\Controllers\Api\Communities;

use App\Domain\Communities\DTOs\SolicitarCrearComunidadData;
use App\Domain\Communities\Services\ComunidadService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Communities\SolicitarCrearComunidadRequest;
use App\Http\Resources\ComunidadResource;
use App\Http\Resources\SolicitudMembresiaResource;
use App\Models\Comunidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function __construct(
        private readonly ComunidadService $comunidadService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $comunidades = $this->comunidadService->buscar($request->string('q')->value() ?: null);

        return response()->json(['comunidades' => ComunidadResource::collection($comunidades)]);
    }

    public function show(Comunidad $comunidad): JsonResponse
    {
        $comunidad->load('lider')->loadCount(['miembros', 'miembrosConectados']);

        return response()->json(['comunidad' => new ComunidadResource($comunidad)]);
    }

    public function solicitarCreacion(SolicitarCrearComunidadRequest $request): JsonResponse
    {
        $solicitud = $this->comunidadService->solicitarCreacion(
            $request->user(),
            SolicitarCrearComunidadData::desdeArray($request->validated()),
        );

        return response()->json([
            'solicitud' => new SolicitudMembresiaResource($solicitud),
        ], 201);
    }

    public function miComunidad(Request $request): JsonResponse
    {
        $membresia = $request->user()->membresiaActiva()->with('comunidad.lider')->first();
        $membresia?->comunidad->loadCount(['miembros', 'miembrosConectados']);

        return response()->json([
            'comunidad' => $membresia ? new ComunidadResource($membresia->comunidad) : null,
        ]);
    }
}
