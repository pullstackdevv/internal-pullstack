<?php

namespace App\Modules\Money\Services;

use App\Modules\Money\Models\MoneyBudget;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * All money math lives here so the web UI, the REST API and the report
 * always agree: a wallet balance is opening_balance + sum(income) - sum(expense).
 */
class MoneySummary
{
    public function walletBalance(MoneyWallet $wallet): int
    {
        $income = (int) $wallet->transactions()->where('type', 'income')->sum('amount');
        $expense = (int) $wallet->transactions()->where('type', 'expense')->sum('amount');

        return (int) $wallet->opening_balance + $income - $expense;
    }

    /** @return Collection<int, MoneyWallet> wallets with a computed `balance` attribute */
    public function walletsWithBalance(bool $onlyActive = false): Collection
    {
        $sums = MoneyTransaction::query()
            ->selectRaw('wallet_id, type, SUM(amount) as total')
            ->groupBy('wallet_id', 'type')
            ->get()
            ->groupBy('wallet_id');

        return MoneyWallet::query()
            ->when($onlyActive, fn ($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(function (MoneyWallet $wallet) use ($sums) {
                $rows = $sums->get($wallet->id, collect());
                $income = (int) ($rows->firstWhere('type', 'income')->total ?? 0);
                $expense = (int) ($rows->firstWhere('type', 'expense')->total ?? 0);
                $wallet->setAttribute('balance', (int) $wallet->opening_balance + $income - $expense);
                $wallet->setAttribute('transactions_count', (int) $wallet->transactions()->count());

                return $wallet;
            });
    }

    public function totalBalance(): int
    {
        $income = (int) MoneyTransaction::where('type', 'income')->sum('amount');
        $expense = (int) MoneyTransaction::where('type', 'expense')->sum('amount');

        return (int) MoneyWallet::sum('opening_balance') + $income - $expense;
    }

    /** Balance of all wallets for transactions strictly before the given date. */
    public function balanceBefore(Carbon $date): int
    {
        $income = (int) MoneyTransaction::where('type', 'income')->where('date', '<', $date->toDateString())->sum('amount');
        $expense = (int) MoneyTransaction::where('type', 'expense')->where('date', '<', $date->toDateString())->sum('amount');

        return (int) MoneyWallet::sum('opening_balance') + $income - $expense;
    }

    /** @return array{income: int, expense: int, net: int} */
    public function monthTotals(string $month): array
    {
        [$year, $mon] = $this->parseMonth($month);

        $income = (int) MoneyTransaction::where('type', 'income')
            ->whereYear('date', $year)->whereMonth('date', $mon)->sum('amount');
        $expense = (int) MoneyTransaction::where('type', 'expense')
            ->whereYear('date', $year)->whereMonth('date', $mon)->sum('amount');

        return ['income' => $income, 'expense' => $expense, 'net' => $income - $expense];
    }

    /**
     * Monthly series for the last $count months (oldest first), for the
     * dashboard bar chart.
     *
     * @return array<int, array{month: string, label: string, income: int, expense: int}>
     */
    public function monthlySeries(int $count = 6): array
    {
        $labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $series = [];
        $cursor = now()->startOfMonth();

        for ($i = $count - 1; $i >= 0; $i--) {
            $month = $cursor->copy()->subMonths($i);
            $totals = $this->monthTotals($month->format('Y-m'));
            $series[] = [
                'month' => $month->format('Y-m'),
                'label' => $labels[$month->month - 1].' '.$month->format('y'),
                'income' => $totals['income'],
                'expense' => $totals['expense'],
            ];
        }

        return $series;
    }

    /**
     * Budget vs realization for one month, one row per expense category that
     * has a budget or any spending in that month.
     *
     * @return array<int, array{category_id: int, name: string, color: string, budget: int|null, spent: int, remaining: int|null, percent: float|null}>
     */
    public function budgetStatus(string $month): array
    {
        [$year, $mon] = $this->parseMonth($month);

        $budgets = MoneyBudget::where('month', $month)->pluck('amount', 'category_id');
        $spent = MoneyTransaction::where('type', 'expense')
            ->whereYear('date', $year)->whereMonth('date', $mon)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        return MoneyCategory::where('kind', 'expense')->orderBy('name')->get()
            ->filter(fn (MoneyCategory $c) => $budgets->has($c->id) || (int) ($spent[$c->id] ?? 0) > 0)
            ->map(function (MoneyCategory $c) use ($budgets, $spent) {
                $budget = $budgets->has($c->id) ? (int) $budgets[$c->id] : null;
                $spentAmount = (int) ($spent[$c->id] ?? 0);

                return [
                    'category_id' => $c->id,
                    'name' => $c->name,
                    'color' => $c->color,
                    'budget' => $budget,
                    'spent' => $spentAmount,
                    'remaining' => $budget !== null ? $budget - $spentAmount : null,
                    'percent' => $budget !== null && $budget > 0 ? round($spentAmount / $budget * 100, 1) : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Full monthly summary used by the report page and the API.
     *
     * @return array<string, mixed>
     */
    public function summary(string $month): array
    {
        [$year, $mon] = $this->parseMonth($month);
        $start = Carbon::create($year, $mon, 1)->startOfMonth();
        $totals = $this->monthTotals($month);
        $opening = $this->balanceBefore($start);

        $byCategory = MoneyTransaction::query()
            ->whereYear('date', $year)->whereMonth('date', $mon)
            ->selectRaw('category_id, type, SUM(amount) as total')
            ->groupBy('category_id', 'type')
            ->get()
            ->map(function ($row) {
                $category = $row->category_id ? MoneyCategory::find($row->category_id) : null;

                return [
                    'category_id' => $row->category_id,
                    'name' => $category?->name ?? 'Tanpa kategori',
                    'color' => $category?->color ?? '#64748b',
                    'kind' => $row->type,
                    'total' => (int) $row->total,
                ];
            })
            ->sortBy([['kind', 'asc'], ['total', 'desc']])
            ->values()
            ->all();

        return [
            'month' => $month,
            'opening_balance' => $opening,
            'total_income' => $totals['income'],
            'total_expense' => $totals['expense'],
            'net' => $totals['net'],
            'closing_balance' => $opening + $totals['net'],
            'by_category' => $byCategory,
            'budgets' => $this->budgetStatus($month),
        ];
    }

    /** @return array{0: int, 1: int} [year, month] */
    private function parseMonth(string $month): array
    {
        $parts = explode('-', $month);

        return [(int) ($parts[0] ?? now()->year), (int) ($parts[1] ?? now()->month)];
    }
}
