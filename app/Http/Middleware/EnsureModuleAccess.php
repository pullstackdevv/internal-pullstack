<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    private const LEVEL_RANK = ['view' => 1, 'manage' => 2];

    public function handle(Request $request, Closure $next, string $module, string $level): Response
    {
        $user = $request->user();

        abort_if(! $user, 403);

        if ($user->isAdmin()) {
            return $next($request);
        }

        $userLevel = $user->levelFor($module);

        abort_if($userLevel === null, 403);
        abort_if(self::LEVEL_RANK[$userLevel] < self::LEVEL_RANK[$level], 403);

        return $next($request);
    }
}
