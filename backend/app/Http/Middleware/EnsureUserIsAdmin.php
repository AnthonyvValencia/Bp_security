<?php

namespace App\Http\Middleware;

use App\Domain\Users\Enums\RolUsuario;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->user()?->rol !== RolUsuario::Administrador, 403, 'Solo el administrador puede realizar esta acción.');

        return $next($request);
    }
}
