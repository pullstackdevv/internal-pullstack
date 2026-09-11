<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Settings\Http\Requests\UpdateSettingRequest;
use App\Support\Settings\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(private readonly Settings $settings) {}

    public function index(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('settings/index', [
            'issuer' => $this->settings->get('invoice.issuer', [
                'name' => '', 'address' => '', 'phone' => '', 'email' => '',
            ]),
            'payment' => $this->settings->get('invoice.payment', [
                'account_name' => '', 'bank' => '', 'account_number' => '',
            ]),
        ]);
    }

    public function update(UpdateSettingRequest $request, string $code): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $this->settings->set($code, $request->validated('content'));

        return redirect()->route('settings.index');
    }
}
