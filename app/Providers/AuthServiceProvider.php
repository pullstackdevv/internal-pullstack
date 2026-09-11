<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => \App\Modules\Users\Policies\UserPolicy::class,
    ];

    public function boot(): void
    {
        Gate::before(function ($user, string $ability) {
            return $user->isAdmin() ? true : null;
        });
    }
}
