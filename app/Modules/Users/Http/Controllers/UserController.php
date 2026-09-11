<?php

namespace App\Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Users\Http\Requests\StoreUserRequest;
use App\Modules\Users\Http\Requests\UpdateUserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/index', [
            'users' => User::with('moduleAccess')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user = User::create([
            ...$request->safe()->only('name', 'email', 'role'),
            'password' => Hash::make($request->validated('password')),
        ]);

        $user->moduleAccess()->createMany($request->validated('module_access', []));

        return redirect()->route('users.index');
    }

    public function edit(User $user): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/edit', [
            'user' => $user->load('moduleAccess'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user->update([
            ...$request->safe()->only('name', 'email', 'role', 'is_active'),
            ...($request->validated('password') ? ['password' => Hash::make($request->validated('password'))] : []),
        ]);

        $user->moduleAccess()->delete();
        $user->moduleAccess()->createMany($request->validated('module_access', []));

        return redirect()->route('users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user->update(['is_active' => false]);

        return redirect()->route('users.index');
    }
}
