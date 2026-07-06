<?php

namespace App\Http\Controllers\Api\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ContactoEmergenciaRequest;
use App\Http\Resources\ContactoEmergenciaResource;
use App\Models\ContactoEmergencia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmergencyContactController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $contactos = $request->user()->contactosEmergencia;

        return response()->json(['contactos_emergencia' => ContactoEmergenciaResource::collection($contactos)]);
    }

    public function guardar(ContactoEmergenciaRequest $request): JsonResponse
    {
        $contacto = $request->user()->contactosEmergencia()->create($request->validated());

        return response()->json(['contacto_emergencia' => new ContactoEmergenciaResource($contacto)], 201);
    }

    public function actualizar(ContactoEmergenciaRequest $request, ContactoEmergencia $contacto): JsonResponse
    {
        abort_if($contacto->usuario_id !== $request->user()->id, 403);

        $contacto->update($request->validated());

        return response()->json(['contacto_emergencia' => new ContactoEmergenciaResource($contacto)]);
    }

    public function eliminar(Request $request, ContactoEmergencia $contacto): JsonResponse
    {
        abort_if($contacto->usuario_id !== $request->user()->id, 403);

        $contacto->delete();

        return response()->json(status: 204);
    }
}
