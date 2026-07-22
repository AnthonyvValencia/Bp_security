<?php

namespace App\Http\Controllers\Api;

use App\Domain\Notifications\Services\ResumenNotificacionesService;
use App\Http\Controllers\Controller;
use App\Models\Comunidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResumenNotificacionesController extends Controller
{
    public function __construct(
        private readonly ResumenNotificacionesService $resumenService,
    ) {}

    /**
     * Contadores de pendientes del usuario autenticado (insignias del home).
     */
    public function resumen(Request $request): JsonResponse
    {
        return response()->json([
            'resumen' => $this->resumenService->paraUsuario($request->user()),
        ]);
    }

    /**
     * El usuario abrió el chat: se pone al día y su contador vuelve a cero.
     */
    public function marcarChatLeido(Request $request, Comunidad $comunidad): JsonResponse
    {
        $this->authorize('verMiembros', $comunidad);

        $this->resumenService->marcarChatLeido($request->user(), $comunidad);

        return response()->json(['mensaje' => 'Chat marcado como leído.']);
    }
}
