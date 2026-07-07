<?php

namespace App\Providers;

use App\Domain\Users\Enums\RolUsuario;
use App\Domain\Users\Repositories\EloquentUsuarioRepository;
use App\Domain\Users\Repositories\UsuarioRepositoryInterface;
use App\Models\AlertaPanico;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UsuarioRepositoryInterface::class, EloquentUsuarioRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(function (User $usuario, string $ability) {
            return $usuario->rol === RolUsuario::Administrador ? true : null;
        });

        RateLimiter::for('login', function ($request) {
            return Limit::perMinute(5)
                ->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        RateLimiter::for('panic', function ($request) {
            // Los reintentos de la cola offline con el mismo id_cliente no cuentan:
            // ya existe la alerta, así que activar() será idempotente sin crear nada.
            $idCliente = $request->input('id_cliente');

            if ($idCliente && AlertaPanico::query()->where('id_cliente', $idCliente)->exists()) {
                return Limit::none();
            }

            return Limit::perMinute(3)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('reports', function ($request) {
            return Limit::perHour(10)->by($request->user()?->id ?: $request->ip());
        });
    }
}
