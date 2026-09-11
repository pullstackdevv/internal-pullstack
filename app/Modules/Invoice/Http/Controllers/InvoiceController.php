<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Http\Requests\StoreInvoiceRequest;
use App\Modules\Invoice\Http\Requests\UpdateInvoiceRequest;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Invoice\Services\InvoiceNumberGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('invoice/index', [
            'invoices' => Invoice::orderByDesc('sequence')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('invoice/create', [
            'clients' => Client::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreInvoiceRequest $request, InvoiceNumberGenerator $generator): RedirectResponse
    {
        $client = Client::findOrFail($request->validated('client_id'));
        $issueDate = $request->date('issue_date');
        $items = $request->validated('items');

        $generated = $generator->next($issueDate);

        Invoice::create([
            'number' => $generated['number'],
            'sequence' => $generated['sequence'],
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => $issueDate,
            'total' => collect($items)->sum('amount'),
            'content' => ['items' => $items],
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('invoices.index');
    }

    public function edit(Invoice $invoice): Response
    {
        return Inertia::render('invoice/edit', [
            'invoice' => $invoice,
            'clients' => Client::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        $items = $request->validated('items');

        $invoice->update([
            'client_id' => $request->validated('client_id'),
            'issue_date' => $request->date('issue_date'),
            'total' => collect($items)->sum('amount'),
            'content' => ['items' => $items],
        ]);

        return redirect()->route('invoices.index');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        $invoice->delete();

        return redirect()->route('invoices.index');
    }
}
