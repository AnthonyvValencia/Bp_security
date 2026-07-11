<?php

namespace App\Http\Controllers\Api\Chat;

use App\Domain\Chat\Services\ChatService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\EnviarMensajeRequest;
use App\Http\Resources\MensajeChatResource;
use App\Models\Comunidad;
use App\Models\MensajeChat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        private readonly ChatService $chatService,
    ) {}

    public function index(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('verMiembros', $comunidad);

        $mensajes = $this->chatService->listar($comunidad);

        return response()->json(['mensajes' => MensajeChatResource::collection($mensajes)]);
    }

    public function enviar(EnviarMensajeRequest $request, Comunidad $comunidad): JsonResponse
    {
        $this->authorize('verMiembros', $comunidad);

        $mensaje = $this->chatService->enviar(
            $request->user(),
            $comunidad,
            $request->validated('contenido'),
        );

        return response()->json(['mensaje' => new MensajeChatResource($mensaje->load('usuario'))], 201);
    }

    public function eliminar(MensajeChat $mensaje, Request $request): JsonResponse
    {
        $this->authorize('eliminar', $mensaje);

        $this->chatService->eliminar($mensaje, $request->user());

        return response()->json(['mensaje' => 'Mensaje eliminado.']);
    }
}
