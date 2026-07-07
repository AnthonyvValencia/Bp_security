<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aproximación simple de "presencia en línea": registra la última vez que el
 * usuario hizo una petición autenticada, sin necesidad de WebSockets. Se usa
 * para contar "vecinos conectados" (actividad en los últimos 5 minutos).
 */
class ActualizarUltimaActividad
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->user()?->forceFill(['ultima_actividad_en' => now()])->saveQuietly();

        return $next($request);
    }
}
