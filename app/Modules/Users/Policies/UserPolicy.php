<?php

namespace App\Modules\Users\Policies;

use App\Models\User;

class UserPolicy
{
    public function manage(User $user): bool
    {
        return $user->isAdmin();
    }
}
