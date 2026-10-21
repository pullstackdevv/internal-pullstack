<?php

namespace Tests\Feature\Money;

use App\Models\User;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyRecurring;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Money\Services\MoneyLedger;
use App\Modules\Money\Services\MoneySummary;
use App\Modules\Money\Services\RecurringGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoneyBalanceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'admin']);
    }

    private function wallet(int $opening = 0): MoneyWallet
    {
        return MoneyWallet::create([
            'name' => 'Kas',
            'type' => 'cash',
            'opening_balance' => $opening,
        ]);
    }

    private function transact(MoneyWallet $wallet, string $type, int $amount, string $date = '2026-10-05'): MoneyTransaction
    {
        return MoneyTransaction::create([
            'wallet_id' => $wallet->id,
            'type' => $type,
            'amount' => $amount,
            'date' => $date,
            'created_by' => $this->user->id,
        ]);
    }

    public function test_wallet_balance_is_opening_plus_income_minus_expense(): void
    {
        $wallet = $this->wallet(1_000_000);
        $this->transact($wallet, 'income', 2_500_000);
        $this->transact($wallet, 'expense', 750_000);
        $this->transact($wallet, 'expense', 250_000);

        $summary = app(MoneySummary::class);

        $this->assertSame(2_500_000, $summary->walletBalance($wallet));
        $this->assertSame(2_500_000, $summary->totalBalance());
    }

    public function test_total_balance_sums_all_wallets(): void
    {
        $a = $this->wallet(500_000);
        $b = MoneyWallet::create(['name' => 'BCA', 'type' => 'bank', 'opening_balance' => 3_000_000]);
        $this->transact($a, 'expense', 100_000);
        $this->transact($b, 'income', 200_000);

        $this->assertSame(400_000 + 3_200_000, app(MoneySummary::class)->totalBalance());
    }

    public function test_transfer_does_not_change_total_balance(): void
    {
        $summary = app(MoneySummary::class);
        $from = $this->wallet(1_000_000);
        $to = MoneyWallet::create(['name' => 'BCA', 'type' => 'bank', 'opening_balance' => 0]);

        $before = $summary->totalBalance();

        app(MoneyLedger::class)->transfer($this->user, $from, $to, 400_000, '2026-10-10');

        $this->assertSame($before, $summary->totalBalance());
        $this->assertSame(600_000, $summary->walletBalance($from));
        $this->assertSame(400_000, $summary->walletBalance($to));

        $pair = MoneyTransaction::whereNotNull('transfer_id')->get();
        $this->assertCount(2, $pair);
        $this->assertSame($pair[0]->transfer_id, $pair[1]->transfer_id);
    }

    public function test_recurring_generate_creates_transactions_once_per_month(): void
    {
        $wallet = $this->wallet(0);
        $category = MoneyCategory::create(['name' => 'Server & VPS', 'kind' => 'expense', 'color' => '#dc2626']);
        $rule = MoneyRecurring::create([
            'name' => 'VPS bulanan',
            'wallet_id' => $wallet->id,
            'category_id' => $category->id,
            'type' => 'expense',
            'amount' => 350_000,
            'day_of_month' => 5,
            'is_active' => true,
        ]);

        $generator = app(RecurringGenerator::class);

        $this->assertSame(1, $generator->generateForCurrentMonth($this->user));
        $this->assertSame(0, $generator->generateForCurrentMonth($this->user));

        $tx = MoneyTransaction::first();
        $this->assertSame(350_000, $tx->amount);
        $this->assertSame('expense', $tx->type);
        $this->assertSame($category->id, $tx->category_id);
        $this->assertSame(now()->format('Y-m'), $rule->fresh()->last_generated_month);
        $this->assertSame(-350_000, app(MoneySummary::class)->walletBalance($wallet));
    }

    public function test_inactive_recurring_rule_is_skipped(): void
    {
        $wallet = $this->wallet(0);
        MoneyRecurring::create([
            'name' => 'Nonaktif',
            'wallet_id' => $wallet->id,
            'type' => 'expense',
            'amount' => 100_000,
            'day_of_month' => 1,
            'is_active' => false,
        ]);

        $this->assertSame(0, app(RecurringGenerator::class)->generateForCurrentMonth($this->user));
        $this->assertSame(0, MoneyTransaction::count());
    }
}
