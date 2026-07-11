<?php

namespace App\Http\Controllers\Api\Communities;

use App\Http\Controllers\Controller;
use App\Models\AlertaPanico;
use App\Models\Comunidad;
use App\Models\Reporte;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class MuroController extends Controller
{
    /**
     * Feed combinado de alertas de pánico y reportes de la comunidad,
     * visible para cualquier miembro activo (no solo el líder).
     */
    public function index(Comunidad $comunidad): JsonResponse
    {
        $this->authorize('verMiembros', $comunidad);

        $alertas = AlertaPanico::query()
            ->where('comunidad_id', $comunidad->id)
            ->with('usuario')
            ->latest('creada_en')
            ->limit(30)
            ->get()
            ->map(fn (AlertaPanico $alerta) => [
                'tipo' => 'alerta_panico',
                'id' => $alerta->id,
                'estado' => $alerta->estado->value,
                'creado_en' => $alerta->creada_en,
                'latitud' => $alerta->latitud !== null ? (float) $alerta->latitud : null,
                'longitud' => $alerta->longitud !== null ? (float) $alerta->longitud : null,
                'usuario' => [
                    'id' => $alerta->usuario->id,
                    'nombres' => $alerta->usuario->nombres,
                    'apellidos' => $alerta->usuario->apellidos,
                ],
            ]);

        $reportes = Reporte::query()
            ->where('comunidad_id', $comunidad->id)
            ->with('usuario')
            ->latest('created_at')
            ->limit(30)
            ->get()
            ->map(fn (Reporte $reporte) => [
                'tipo' => 'reporte',
                'id' => $reporte->id,
                'estado' => $reporte->estado->value,
                'categoria' => $reporte->categoria->value,
                'titulo' => $reporte->titulo,
                'descripcion' => $reporte->descripcion,
                'creado_en' => $reporte->created_at,
                'usuario' => [
                    'id' => $reporte->usuario->id,
                    'nombres' => $reporte->usuario->nombres,
                    'apellidos' => $reporte->usuario->apellidos,
                ],
            ]);

        $muro = (new Collection([...$alertas, ...$reportes]))
            ->sortByDesc('creado_en')
            ->values()
            ->take(30);

        return response()->json(['muro' => $muro]);
    }
}
