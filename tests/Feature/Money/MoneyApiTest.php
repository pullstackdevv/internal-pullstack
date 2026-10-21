<?php

namespace Tests\Feature\Money;

use App\Models\User;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoneyApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private MoneyWallet $wallet;

    private MoneyCategory $incomeCategory;

    private MoneyCategory $expenseCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->wallet = MoneyWallet::create(['name' => 'BCA', 'type' => 'bank', 'opening_balance' => 1_000_000]);
        $this->incomeCategory = MoneyCategory::create(['name' => 'Jasa Deployment', 'kind' => 'income', 'color' => '#16a34a']);
        $this->expenseCategory = MoneyCategory::create(['name' => 'Server & VPS', 'kind' => 'expense', 'color' => '#dc2626']);
    }

    private function token(array $abilities): string
    {
        return $this->user->createToken('agent-test', $abilities)->plainTextToken;
    }

    /**
     * Authenticate subsequent requests with a real bearer token. Guards are
     * forgotten first: within one test the auth manager would otherwise keep
     * the first token it resolved (a test-only artifact; production requests
     * are separate processes).
     */
    private function bearer(string $plain): static
    {
        auth()->forgetGuards();

        return $this->withHeaders(['Authorization' => "Bearer {$plain}"]);
    }

    public function test_request_without_token_is_unauthorized(): void
    {
        $this->getJson('/api/money/balance')->assertUnauthorized();
        $this->getJson('/api/money/transactions')->assertUnauthorized();
    }

    public function test_request_without_token_and_without_json_accept_header_is_401_json_not_redirect(): void
    {
        // Plain GET (curl-style): no Accept: application/json header, so the
        // request does not "expect JSON". The API contract still requires a
        // 401 JSON response — never a redirect to the web login page.
        $response = $this->get('/api/money/balance');

        $response->assertUnauthorized();
        $response->assertHeader('content-type', 'application/json');
        $response->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public function test_read_token_can_read_balance_but_cannot_write(): void
    {
        $read = $this->token(['money:read']);

        $this->bearer($read)->getJson('/api/money/balance')
            ->assertOk()
            ->assertJsonPath('data.total_balance', 1_000_000);

        $this->bearer($read)->postJson('/api/money/transactions', [
            'wallet_id' => $this->wallet->id,
            'type' => 'income',
            'amount' => 500_000,
            'date' => '2026-10-03',
        ])->assertForbidden();

        $this->assertSame(0, MoneyTransaction::count());
    }

    public function test_write_token_can_create_transaction_and_balance_changes(): void
    {
        $write = $this->token(['money:read', 'money:write']);

        $response = $this->bearer($write)->postJson('/api/money/transactions', [
            'wallet_id' => $this->wallet->id,
            'category_id' => $this->incomeCategory->id,
            'type' => 'income',
            'amount' => 2_000_000,
            'date' => '2026-10-03',
            'note' => 'Pembayaran deployment',
        ]);

        $response->assertCreated()->assertJsonPath('data.amount', 2_000_000);

        $this->bearer($write)->getJson('/api/money/balance')
            ->assertOk()
            ->assertJsonPath('data.total_balance', 3_000_000);
    }

    public function test_create_transaction_validates_input(): void
    {
        $write = $this->token(['money:write']);

        $this->bearer($write)->postJson('/api/money/transactions', [
            'wallet_id' => 9999,
            'type' => 'income',
            'amount' => 0,
            'date' => 'bukan-tanggal',
        ])->assertUnprocessable()->assertJsonValidationErrors(['wallet_id', 'amount', 'date']);

        // category kind must match transaction type
        $this->bearer($write)->postJson('/api/money/transactions', [
            'wallet_id' => $this->wallet->id,
            'category_id' => $this->expenseCategory->id,
            'type' => 'income',
            'amount' => 1000,
            'date' => '2026-10-03',
        ])->assertUnprocessable()->assertJsonValidationErrors(['category_id']);
    }

    public function test_write_token_can_update_and_delete_transaction(): void
    {
        $write = $this->token(['money:read', 'money:write']);
        $tx = MoneyTransaction::create([
            'wallet_id' => $this->wallet->id,
            'type' => 'expense',
            'amount' => 100_000,
            'date' => '2026-10-04',
            'created_by' => $this->user->id,
        ]);

        $this->bearer($write)->patchJson("/api/money/transactions/{$tx->id}", [
            'amount' => 150_000,
            'note' => 'Revisi',
        ])->assertOk()->assertJsonPath('data.amount', 150_000);

        $this->bearer($write)->deleteJson("/api/money/transactions/{$tx->id}")
            ->assertOk();

        $this->assertSame(0, MoneyTransaction::count());
    }

    public function test_summary_computes_totals_and_budget_status(): void
    {
        $read = $this->token(['money:read']);
        MoneyTransaction::create(['wallet_id' => $this->wallet->id, 'category_id' => $this->incomeCategory->id, 'type' => 'income', 'amount' => 5_000_000, 'date' => '2026-10-02', 'created_by' => $this->user->id]);
        MoneyTransaction::create(['wallet_id' => $this->wallet->id, 'category_id' => $this->expenseCategory->id, 'type' => 'expense', 'amount' => 1_200_000, 'date' => '2026-10-06', 'created_by' => $this->user->id]);
        \App\Modules\Money\Models\MoneyBudget::create(['category_id' => $this->expenseCategory->id, 'month' => '2026-10', 'amount' => 2_000_000]);

        $this->bearer($read)->getJson('/api/money/summary?month=2026-10')
            ->assertOk()
            ->assertJsonPath('data.month', '2026-10')
            ->assertJsonPath('data.total_income', 5_000_000)
            ->assertJsonPath('data.total_expense', 1_200_000)
            ->assertJsonPath('data.net', 3_800_000)
            ->assertJsonPath('data.opening_balance', 1_000_000)
            ->assertJsonPath('data.closing_balance', 4_800_000)
            ->assertJsonPath('data.budgets.0.spent', 1_200_000)
            ->assertJsonPath('data.budgets.0.percent', 60);
    }

    public function test_export_requires_export_ability(): void
    {
        $read = $this->token(['money:read']);
        $export = $this->token(['money:read', 'money:export']);

        $this->bearer($read)->getJson('/api/money/export?month=2026-10&format=csv')
            ->assertForbidden();

        $response = $this->bearer($export)->get('/api/money/export.csv?month=2026-10');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
    }

    public function test_categories_and_wallets_writes_require_admin_ability(): void
    {
        $write = $this->token(['money:read', 'money:write']);
        $admin = $this->token(['money:read', 'money:admin']);

        $this->bearer($write)->postJson('/api/money/categories', [
            'name' => 'Konsultasi', 'kind' => 'income', 'color' => '#0ea5e9',
        ])->assertForbidden();

        $this->bearer($admin)->postJson('/api/money/categories', [
            'name' => 'Konsultasi', 'kind' => 'income', 'color' => '#0ea5e9',
        ])->assertCreated()->assertJsonPath('data.name', 'Konsultasi');

        $this->bearer($write)->postJson('/api/money/wallets', [
            'name' => 'OVO', 'type' => 'ewallet', 'opening_balance' => 50_000,
        ])->assertForbidden();

        $this->bearer($admin)->postJson('/api/money/wallets', [
            'name' => 'OVO', 'type' => 'ewallet', 'opening_balance' => 50_000,
        ])->assertCreated()->assertJsonPath('data.balance', 50_000);
    }

    public function test_transactions_can_be_filtered_by_month_and_type(): void
    {
        $read = $this->token(['money:read']);
        MoneyTransaction::create(['wallet_id' => $this->wallet->id, 'type' => 'income', 'amount' => 100, 'date' => '2026-10-01', 'created_by' => $this->user->id]);
        MoneyTransaction::create(['wallet_id' => $this->wallet->id, 'type' => 'expense', 'amount' => 200, 'date' => '2026-10-02', 'created_by' => $this->user->id]);
        MoneyTransaction::create(['wallet_id' => $this->wallet->id, 'type' => 'income', 'amount' => 300, 'date' => '2026-09-01', 'created_by' => $this->user->id]);

        $this->bearer($read)->getJson('/api/money/transactions?month=2026-10&type=income')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.amount', 100);
    }
}
