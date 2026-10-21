<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Http\Requests\StoreMoneyBudgetsRequest;
use App\Modules\Money\Http\Requests\StoreMoneyRecurringRequest;
use App\Modules\Money\Models\MoneyBudget;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyRecurring;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Money\Services\MoneySummary;
use App\Modules\Money\Services\RecurringGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyBudgetController extends Controller
{
    public function __construct(private readonly MoneySummary $summary) {}

    public function index(Request $request): Response
    {
        $month = (string) $request->query('month', now()->format('Y-m'));
        $status = collect($this->summary->budgetStatus($month))->keyBy('category_id');

        $categories = MoneyCategory::where('kind', 'expense')->orderBy('name')->get()
            ->map(fn (MoneyCategory $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'color' => $c->color,
                'budget' => $status[$c->id]['budget'] ?? null,
                'spent' => $status[$c->id]['spent'] ?? 0,
                'percent' => $status[$c->id]['percent'] ?? null,
            ]);

        return Inertia::render('money/budgets/index', [
            'month' => $month,
            'categories' => $categories,
            'recurring' => MoneyRecurring::with(['wallet', 'category'])->orderBy('name')->get()
                ->map(fn (MoneyRecurring $rule) => [
                    'id' => $rule->id,
                    'name' => $rule->name,
                    'wallet_name' => $rule->wallet?->name,
                    'category_name' => $rule->category?->name,
                    'type' => $rule->type,
                    'amount' => $rule->amount,
                    'day_of_month' => $rule->day_of_month,
                    'is_active' => (bool) $rule->is_active,
                    'last_generated_month' => $rule->last_generated_month,
                ]),
            'wallets' => MoneyWallet::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'allCategories' => MoneyCategory::orderBy('kind')->orderBy('name')->get(['id', 'name', 'kind', 'color']),
            'generatedCount' => session('generated_count'),
        ]);
    }

    public function store(StoreMoneyBudgetsRequest $request): RedirectResponse
    {
        $month = $request->validated('month');

        foreach ($request->validated('budgets') as $row) {
            if ($row['amount'] === null) {
                MoneyBudget::where('category_id', $row['category_id'])->where('month', $month)->delete();
            } else {
                MoneyBudget::updateOrCreate(
                    ['category_id' => $row['category_id'], 'month' => $month],
                    ['amount' => $row['amount']],
                );
            }
        }

        return redirect()->route('money.budgets.index', ['month' => $month]);
    }

    public function storeRecurring(StoreMoneyRecurringRequest $request): RedirectResponse
    {
        MoneyRecurring::create($request->validated());

        return redirect()->route('money.budgets.index');
    }

    public function destroyRecurring(MoneyRecurring $recurring): RedirectResponse
    {
        $recurring->delete();

        return redirect()->route('money.budgets.index');
    }

    public function generateRecurring(Request $request, RecurringGenerator $generator): RedirectResponse
    {
        $created = $generator->generateForCurrentMonth($request->user());

        return redirect()->route('money.budgets.index')->with('generated_count', $created);
    }
}
