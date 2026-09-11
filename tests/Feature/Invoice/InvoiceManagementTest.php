<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceManagementTest extends TestCase
{
    use RefreshDatabase;

    private function manageUser(): User
    {
        $user = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $user->id, 'module' => 'invoice', 'level' => 'manage']);

        return $user;
    }

    public function test_view_level_staff_cannot_create_invoice(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'view']);

        $response = $this->actingAs($staff)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $response->assertForbidden();
    }

    public function test_creating_invoice_computes_total_and_snapshots_client_name(): void
    {
        $client = Client::create(['name' => 'Kolegium Orthopedi']);
        $user = $this->manageUser();

        $response = $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [
                ['description' => 'Advance Security for NIK', 'month' => '', 'amount' => 6500000],
                ['description' => 'Study Tracer', 'month' => 'September 2026', 'amount' => 3500000],
            ],
        ]);

        $response->assertRedirect('/invoices');

        $invoice = Invoice::first();
        $this->assertSame('10000000.00', $invoice->total);
        $this->assertSame('Kolegium Orthopedi', $invoice->client_name);
        $this->assertSame('INV/PSDEV/001/05/09/2026', $invoice->number);
        $this->assertSame($user->id, $invoice->created_by);
    }

    public function test_client_name_snapshot_survives_client_rename(): void
    {
        $client = Client::create(['name' => 'Nama Lama']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $client->update(['name' => 'Nama Baru']);

        $invoice = Invoice::first();
        $this->assertSame('Nama Lama', $invoice->client_name);
    }

    public function test_updating_invoice_recomputes_total(): void
    {
        $client = Client::create(['name' => 'Client']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $invoice = Invoice::first();

        $this->actingAs($user)->put("/invoices/{$invoice->id}", [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [
                ['description' => 'A', 'month' => '', 'amount' => 1000],
                ['description' => 'B', 'month' => '', 'amount' => 2000],
            ],
        ])->assertRedirect('/invoices');

        $this->assertSame('3000.00', $invoice->fresh()->total);
    }

    public function test_two_invoices_created_in_sequence_get_distinct_numbers(): void
    {
        $client = Client::create(['name' => 'Client']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-06',
            'items' => [['description' => 'B', 'month' => '', 'amount' => 2000]],
        ]);

        $numbers = Invoice::orderBy('sequence')->pluck('number');
        $this->assertSame(['INV/PSDEV/001/05/09/2026', 'INV/PSDEV/002/06/09/2026'], $numbers->toArray());
    }
}
