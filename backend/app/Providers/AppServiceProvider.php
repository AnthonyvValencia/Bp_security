<?php

namespace App\Providers;

use App\Domain\Users\Enums\RolUsuario;
use App\Domain\Users\Repositories\EloquentUsuarioRepository;
use App\Domain\Users\Repositories\UsuarioRepositoryInterface;
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
    }
}
