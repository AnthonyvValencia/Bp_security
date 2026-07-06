<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function view(User $auth, User $usuario): bool
    {
        return $auth->id === $usuario->id;
    }

    public function update(User $auth, User $usuario): bool
    {
        return $auth->id === $usuario->id;
    }
}
