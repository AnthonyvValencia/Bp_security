<?php

namespace App\Http\Controllers\Api\Reports;

use App\Domain\Reports\DTOs\CrearReporteData;
use App\Domain\Reports\Enums\EstadoReporte;
use App\Domain\Reports\Services\ReporteService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\CambiarEstadoReporteRequest;
use App\Http\Requests\Reports\CrearReporteRequest;
use App\Http\Resources\ReporteResource;
use App\Models\Comunidad;
use App\Models\Reporte;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReporteService $reporteService,
    ) {}

    public function crear(CrearReporteRequest $request): JsonResponse
    {
        $reporte = $this->reporteService->crear(
            $request->user(),
            CrearReporteData::desdeArray($request->validated()),
        );

        return response()->json(['reporte' => new ReporteResource($reporte)], 201);
    }

    public function propios(Request $request): JsonResponse
    {
        $reportes = $this->reporteService->listarPropios($request->user());

        return response()->json(['reportes' => ReporteResource::collection($reportes)]);
    }

    public function porComunidad(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('gestionar', $comunidad);

        $reportes = $this->reporteService->listarPorComunidad($comunidad);

        return response()->json(['reportes' => ReporteResource::collection($reportes)]);
    }

    public function detalle(Reporte $reporte): JsonResponse
    {
        $this->authorize('ver', $reporte);

        $reporte->load(['usuario', 'historialEstados.cambiadoPor']);

        return response()->json(['reporte' => new ReporteResource($reporte)]);
    }

    public function cambiarEstado(CambiarEstadoReporteRequest $request, Reporte $reporte): JsonResponse
    {
        $this->authorize('gestionar', $reporte);

        $reporte = $this->reporteService->cambiarEstado(
            $reporte,
            $request->user(),
            EstadoReporte::from($request->validated('estado')),
            $request->validated('comentario'),
        );

        return response()->json(['reporte' => new ReporteResource($reporte)]);
    }

    public function eliminar(Request $request, Reporte $reporte): JsonResponse
    {
        $this->authorize('eliminar', $reporte);

        $this->reporteService->eliminar($reporte, $request->user());

        return response()->json(['mensaje' => 'Reporte eliminado.']);
    }
}
