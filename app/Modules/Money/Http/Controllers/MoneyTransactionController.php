<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Money\Http\Requests\StoreMoneyTransactionRequest;
use App\Modules\Money\Http\Requests\UpdateMoneyTransactionRequest;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MoneyTransactionController extends Controller
{
    public function index(): Response
    {
        $transactions = MoneyTransaction::with(['wallet', 'category'])
            ->orderByDesc('date')->orderByDesc('id')
            ->get()
            ->map(fn (MoneyTransaction $tx) => [
                'id' => $tx->id,
                'date' => $tx->date->format('Y-m-d'),
                'type' => $tx->type,
                'amount' => $tx->amount,
                'note' => $tx->note,
                'wallet_id' => $tx->wallet_id,
                'wallet_name' => $tx->wallet?->name,
                'category_id' => $tx->category_id,
                'category_name' => $tx->category?->name,
                'category_color' => $tx->category?->color,
                'invoice_id' => $tx->invoice_id,
            ]);

        return Inertia::render('money/transactions/index', [
            'transactions' => $transactions,
            ...$this->formOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('money/transactions/create', $this->formOptions());
    }

    public function store(StoreMoneyTransactionRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $markPaid = $data['mark_paid'] ?? false;
        unset($data['mark_paid']);
        $data['created_by'] = $request->user()->id;

        MoneyTransaction::create($data);

        if ($markPaid && ! empty($data['invoice_id'])) {
            Invoice::where('id', $data['invoice_id'])->update(['status' => 'paid']);
        }

        return redirect()->route('money.transactions.index');
    }

    public function edit(MoneyTransaction $transaction): Response
    {
        return Inertia::render('money/transactions/edit', [
            'transaction' => [
                'id' => $transaction->id,
                'wallet_id' => $transaction->wallet_id,
                'category_id' => $transaction->category_id,
                'type' => $transaction->type,
                'amount' => $transaction->amount,
                'date' => $transaction->date->format('Y-m-d'),
                'note' => $transaction->note,
                'invoice_id' => $transaction->invoice_id,
            ],
            ...$this->formOptions(),
        ]);
    }

    public function update(UpdateMoneyTransactionRequest $request, MoneyTransaction $transaction): RedirectResponse
    {
        $data = $request->validated();
        $markPaid = $data['mark_paid'] ?? false;
        unset($data['mark_paid']);

        $transaction->update($data);

        if ($markPaid && $transaction->invoice_id) {
            Invoice::where('id', $transaction->invoice_id)->update(['status' => 'paid']);
        }

        return redirect()->route('money.transactions.index');
    }

    public function destroy(MoneyTransaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return redirect()->route('money.transactions.index');
    }

    /** @return array<string, mixed> options shared by the index (quick add) and form pages */
    private function formOptions(): array
    {
        return [
            'wallets' => MoneyWallet::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'categories' => MoneyCategory::where('is_active', true)->orderBy('kind')->orderBy('name')
                ->get(['id', 'name', 'kind', 'color']),
            'invoices' => Invoice::orderByDesc('sequence')
                ->get(['id', 'number', 'client_name', 'status', 'total'])
                ->map(fn (Invoice $invoice) => [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'client_name' => $invoice->client_name,
                    'status' => $invoice->status,
                    'total' => (float) $invoice->total,
                ]),
        ];
    }
}
