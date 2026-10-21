<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Http\Requests\StoreMoneyApiTokenRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Admin-only management of Sanctum tokens used by external agents through
 * the MCP server. The token abilities ARE the permission system:
 * money:read / money:write / money:export / money:admin.
 */
class MoneyApiTokenController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isAdmin(), 403);

        $tokens = $request->user()->tokens()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PersonalAccessToken $token) => [
                'id' => $token->id,
                'name' => $token->name,
                'abilities' => $token->abilities ?? [],
                'last_used_at' => $token->last_used_at?->toIso8601String(),
                'created_at' => $token->created_at?->toIso8601String(),
            ]);

        return Inertia::render('money/api-tokens/index', [
            'tokens' => $tokens,
            'availableAbilities' => StoreMoneyApiTokenRequest::ABILITIES,
            'plainToken' => session('plain_token'),
        ]);
    }

    public function store(StoreMoneyApiTokenRequest $request): RedirectResponse
    {
        $token = $request->user()->createToken(
            $request->validated('name'),
            $request->validated('abilities'),
        );

        return redirect()->route('money.api-tokens.index')
            ->with('plain_token', $token->plainTextToken);
    }

    public function destroy(Request $request, PersonalAccessToken $token): RedirectResponse
    {
        abort_unless($request->user()?->isAdmin(), 403);
        abort_unless($token->tokenable_id === $request->user()->id, 404);

        $token->delete();

        return redirect()->route('money.api-tokens.index');
    }
}
