<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Http\Requests\StoreMoneyWalletRequest;
use App\Modules\Money\Http\Requests\TransferMoneyRequest;
use App\Modules\Money\Http\Requests\UpdateMoneyWalletRequest;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Money\Services\MoneyLedger;
use App\Modules\Money\Services\MoneySummary;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MoneyWalletController extends Controller
{
    public function __construct(
        private readonly MoneySummary $summary,
        private readonly MoneyLedger $ledger,
    ) {}

    public function index(): Response
    {
        return Inertia::render('money/wallets/index', [
            'wallets' => $this->summary->walletsWithBalance()
                ->map(fn (MoneyWallet $w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                    'type' => $w->type,
                    'opening_balance' => (int) $w->opening_balance,
                    'balance' => $w->balance,
                    'transactions_count' => $w->transactions_count,
                    'is_active' => (bool) $w->is_active,
                ])->values()->all(),
        ]);
    }

    public function store(StoreMoneyWalletRequest $request): RedirectResponse
    {
        MoneyWallet::create($request->validated());

        return redirect()->route('money.wallets.index');
    }

    public function update(UpdateMoneyWalletRequest $request, MoneyWallet $wallet): RedirectResponse
    {
        $wallet->update($request->validated());

        return redirect()->route('money.wallets.index');
    }

    public function destroy(MoneyWallet $wallet): RedirectResponse
    {
        $wallet->delete();

        return redirect()->route('money.wallets.index');
    }

    public function transfer(TransferMoneyRequest $request): RedirectResponse
    {
        $from = MoneyWallet::findOrFail($request->validated('from_wallet_id'));
        $to = MoneyWallet::findOrFail($request->validated('to_wallet_id'));

        $this->ledger->transfer(
            $request->user(),
            $from,
            $to,
            (int) $request->validated('amount'),
            $request->validated('date'),
            $request->validated('note'),
        );

        return redirect()->route('money.wallets.index');
    }
}
