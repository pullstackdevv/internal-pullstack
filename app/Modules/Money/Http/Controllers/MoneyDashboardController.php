<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Money\Services\MoneySummary;
use Inertia\Inertia;
use Inertia\Response;

class MoneyDashboardController extends Controller
{
    public function __construct(private readonly MoneySummary $summary) {}

    public function index(): Response
    {
        $month = now()->format('Y-m');
        $totals = $this->summary->monthTotals($month);

        $recent = MoneyTransaction::with(['wallet', 'category'])
            ->orderByDesc('date')->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn (MoneyTransaction $tx) => [
                'id' => $tx->id,
                'date' => $tx->date->format('Y-m-d'),
                'type' => $tx->type,
                'amount' => $tx->amount,
                'note' => $tx->note,
                'wallet_name' => $tx->wallet?->name,
                'category_name' => $tx->category?->name,
                'category_color' => $tx->category?->color,
            ]);

        return Inertia::render('money/index', [
            'month' => $month,
            'totalBalance' => $this->summary->totalBalance(),
            'monthIncome' => $totals['income'],
            'monthExpense' => $totals['expense'],
            'monthNet' => $totals['net'],
            'wallets' => $this->summary->walletsWithBalance()
                ->map(fn (MoneyWallet $w) => [
                    'id' => $w->id,
                    'name' => $w->name,
                    'type' => $w->type,
                    'balance' => $w->balance,
                    'transactions_count' => $w->transactions_count,
                    'is_active' => (bool) $w->is_active,
                ])->values()->all(),
            'series' => $this->summary->monthlySeries(6),
            'budgets' => $this->summary->budgetStatus($month),
            'recentTransactions' => $recent,
        ]);
    }
}
