<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Http\Requests\StoreClientRequest;
use App\Modules\Invoice\Http\Requests\UpdateClientRequest;
use App\Modules\Invoice\Models\Client;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('invoice/clients/index', [
            'clients' => Client::orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('invoice/clients/create');
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        return redirect()->route('clients.index');
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('invoice/clients/edit', ['client' => $client]);
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return redirect()->route('clients.index');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('clients.index');
    }
}
