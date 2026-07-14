<?php

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Users\Enums\RolUsuario;
use App\Domain\Users\Services\AdminUsuarioService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CambiarRolUsuarioRequest;
use App\Http\Resources\AdminUsuarioResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function __construct(
        private readonly AdminUsuarioService $usuarioService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $usuarios = $this->usuarioService->listar(
            $request->string('q')->value() ?: null,
            $request->string('rol')->value() ?: null,
            $request->string('estado')->value() ?: null,
        );

        return response()->json(['usuarios' => AdminUsuarioResource::collection($usuarios)]);
    }

    public function show(User $usuario): JsonResponse
    {
        return response()->json([
            'usuario' => new AdminUsuarioResource($usuario->load('membresiaActiva.comunidad')),
        ]);
    }

    public function suspender(Request $request, User $usuario): JsonResponse
    {
        $usuario = $this->usuarioService->suspender($usuario, $request->user());

        return response()->json(['usuario' => new AdminUsuarioResource($usuario)]);
    }

    public function reactivar(Request $request, User $usuario): JsonResponse
    {
        $usuario = $this->usuarioService->reactivar($usuario, $request->user());

        return response()->json(['usuario' => new AdminUsuarioResource($usuario)]);
    }

    public function cambiarRol(CambiarRolUsuarioRequest $request, User $usuario): JsonResponse
    {
        $usuario = $this->usuarioService->cambiarRol(
            $usuario,
            RolUsuario::from($request->validated('rol')),
            $request->user(),
        );

        return response()->json(['usuario' => new AdminUsuarioResource($usuario)]);
    }
}
