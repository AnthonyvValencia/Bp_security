<?php

namespace App\Http\Controllers\Api\Panic;

use App\Domain\Panic\DTOs\ActivarAlertaData;
use App\Domain\Panic\Services\PanicService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Panic\ActivarAlertaRequest;
use App\Http\Requests\Panic\CerrarAlertaRequest;
use App\Http\Resources\AlertaPanicoResource;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PanicAlertController extends Controller
{
    public function __construct(
        private readonly PanicService $panicService,
    ) {}

    public function activar(ActivarAlertaRequest $request): JsonResponse
    {
        $alerta = $this->panicService->activar(
            $request->user(),
            ActivarAlertaData::desdeArray($request->validated()),
        );

        return response()->json(['alerta' => new AlertaPanicoResource($alerta)], 201);
    }

    public function propias(Request $request): JsonResponse
    {
        $alertas = $this->panicService->listarPropias($request->user());

        return response()->json(['alertas' => AlertaPanicoResource::collection($alertas)]);
    }

    public function porComunidad(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('gestionar', $comunidad);

        $alertas = $this->panicService->listarPorComunidad($comunidad);

        return response()->json(['alertas' => AlertaPanicoResource::collection($alertas)]);
    }

    public function sinComunidad(): JsonResponse
    {
        $alertas = $this->panicService->listarSinComunidad();

        return response()->json(['alertas' => AlertaPanicoResource::collection($alertas)]);
    }

    public function cancelar(Request $request, AlertaPanico $alerta): JsonResponse
    {
        $this->authorize('cancelar', $alerta);

        $alerta = $this->panicService->cancelar($alerta, $request->user());

        return response()->json(['alerta' => new AlertaPanicoResource($alerta)]);
    }

    public function eliminar(Request $request, AlertaPanico $alerta): JsonResponse
    {
        $this->authorize('eliminar', $alerta);

        $this->panicService->eliminar($alerta, $request->user());

        return response()->json(['mensaje' => 'Alerta eliminada.']);
    }

    public function reconocer(Request $request, AlertaPanico $alerta): JsonResponse
    {
        $this->authorize('gestionar', $alerta);

        $alerta = $this->panicService->reconocer($alerta, $request->user());

        return response()->json(['alerta' => new AlertaPanicoResource($alerta)]);
    }

    public function resolver(CerrarAlertaRequest $request, AlertaPanico $alerta): JsonResponse
    {
        $this->authorize('gestionar', $alerta);

        $alerta = $this->panicService->resolver($alerta, $request->user(), $request->validated('notas'));

        return response()->json(['alerta' => new AlertaPanicoResource($alerta)]);
    }

    public function falsaAlarma(CerrarAlertaRequest $request, AlertaPanico $alerta): JsonResponse
    {
        $this->authorize('gestionar', $alerta);

        $alerta = $this->panicService->marcarFalsaAlarma($alerta, $request->user(), $request->validated('notas'));

        return response()->json(['alerta' => new AlertaPanicoResource($alerta)]);
    }
}
