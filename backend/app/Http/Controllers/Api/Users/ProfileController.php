<?php

namespace App\Http\Controllers\Api\Users;

use App\Domain\Users\DTOs\ActualizarPerfilData;
use App\Domain\Users\Services\PerfilService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ActualizarPerfilRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private readonly PerfilService $perfilService,
    ) {}

    public function mostrar(Request $request): JsonResponse
    {
        $usuario = $request->user()->load('contactosEmergencia');

        return response()->json(['usuario' => new UsuarioResource($usuario)]);
    }

    public function actualizar(ActualizarPerfilRequest $request): JsonResponse
    {
        $this->authorize('update', $request->user());

        $usuario = $this->perfilService->actualizar(
            $request->user(),
            ActualizarPerfilData::desdeArray($request->validated()),
        );

        return response()->json(['usuario' => new UsuarioResource($usuario->load('contactosEmergencia'))]);
    }
}
