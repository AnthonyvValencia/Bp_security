<?php

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\DTOs\RegistrarUsuarioData;
use App\Domain\Auth\Services\AuthService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\IniciarSesionRequest;
use App\Http\Requests\Auth\OlvideContrasenaRequest;
use App\Http\Requests\Auth\RegistrarRequest;
use App\Http\Requests\Auth\RestablecerContrasenaRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function registrar(RegistrarRequest $request): JsonResponse
    {
        $usuario = $this->authService->registrar(
            RegistrarUsuarioData::desdeArray($request->validated()),
        );

        $token = $usuario->createToken('mobile')->plainTextToken;

        return response()->json([
            'usuario' => new UsuarioResource($usuario),
            'token' => $token,
        ], 201);
    }

    public function iniciarSesion(IniciarSesionRequest $request): JsonResponse
    {
        $usuario = $this->authService->iniciarSesion(
            $request->string('email')->value(),
            $request->string('password')->value(),
            $request,
        );

        if (! $usuario) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $usuario->createToken('mobile')->plainTextToken;

        return response()->json([
            'usuario' => new UsuarioResource($usuario),
            'token' => $token,
        ]);
    }

    public function cerrarSesion(Request $request): JsonResponse
    {
        $this->authService->cerrarSesion($request->user());

        return response()->json(['mensaje' => 'Sesión cerrada correctamente.']);
    }

    public function olvideContrasena(OlvideContrasenaRequest $request): JsonResponse
    {
        $estado = $this->authService->enviarEnlaceRecuperacion(
            $request->string('email')->value(),
        );

        if ($estado !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($estado)],
            ]);
        }

        return response()->json(['mensaje' => 'Enlace de recuperación enviado a tu correo.']);
    }

    public function restablecerContrasena(RestablecerContrasenaRequest $request): JsonResponse
    {
        $estado = $this->authService->restablecerContrasena(
            $request->string('email')->value(),
            $request->string('token')->value(),
            $request->string('password')->value(),
        );

        if ($estado !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($estado)],
            ]);
        }

        return response()->json(['mensaje' => 'Contraseña restablecida correctamente.']);
    }
}
