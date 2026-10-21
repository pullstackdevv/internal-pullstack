<?php

namespace Tests\Feature\Money;

use App\Models\User;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MoneyWebTest extends TestCase
{
    use RefreshDatabase;

    private function staffWith(?string $level): User
    {
        $user = User::factory()->create(['role' => 'staff']);
        if ($level) {
            ModuleUser::create(['user_id' => $user->id, 'module' => 'money', 'level' => $level]);
        }

        return $user;
    }

    public function test_admin_can_open_money_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get('/money')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('money/index')
                ->has('totalBalance')
                ->has('wallets')
                ->has('budgets'));
    }

    public function test_staff_without_money_access_is_forbidden(): void
    {
        $staff = $this->staffWith(null);

        $this->actingAs($staff)->get('/money')->assertForbidden();
        $this->actingAs($staff)->get('/money/transactions')->assertForbidden();
    }

    public function test_view_level_staff_can_read_but_not_write(): void
    {
        $staff = $this->staffWith('view');
        $wallet = MoneyWallet::create(['name' => 'Kas', 'type' => 'cash', 'opening_balance' => 0]);

        $this->actingAs($staff)->get('/money/transactions')->assertOk();

        $this->actingAs($staff)->post('/money/transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'income',
            'amount' => 1000,
            'date' => '2026-10-01',
        ])->assertForbidden();
    }

    public function test_manage_level_staff_can_create_transaction_via_web(): void
    {
        $staff = $this->staffWith('manage');
        $wallet = MoneyWallet::create(['name' => 'Kas', 'type' => 'cash', 'opening_balance' => 0]);

        $this->actingAs($staff)->post('/money/transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'expense',
            'amount' => 25_000,
            'date' => '2026-10-01',
            'note' => 'Beli kabel',
        ])->assertRedirect('/money/transactions');

        $this->assertDatabaseHas('money_transactions', ['amount' => 25_000, 'note' => 'Beli kabel']);
    }

    public function test_api_tokens_page_is_admin_only(): void
    {
        $staff = $this->staffWith('manage');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($staff)->get('/money/api-tokens')->assertForbidden();
        $this->actingAs($admin)->get('/money/api-tokens')->assertOk();
    }
}
