<?php

use App\Domain\Chat\Exceptions\ReglaChatException;
use App\Domain\Communities\Exceptions\ReglaComunidadException;
use App\Domain\Panic\Exceptions\ReglaAlertaException;
use App\Domain\Reports\Exceptions\ReglaReporteException;
use App\Http\Middleware\ActualizarUltimaActividad;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);
        $middleware->api(append: [ActualizarUltimaActividad::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->is('broadcasting/*'),
        );

        $exceptions->render(function (ReglaComunidadException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        $exceptions->render(function (ReglaAlertaException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        $exceptions->render(function (ReglaReporteException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        $exceptions->render(function (ReglaChatException $e, Request $request) {
            return response()->json(['message' => $e->getMessage()], 422);
        });
    })->create();
