<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicePdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_view_level_staff_can_download_pdf(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $user = User::factory()->create();
        $invoice = Invoice::create([
            'number' => 'INV/PSDEV/001/05/09/2026',
            'sequence' => 1,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => '2026-09-05',
            'total' => 1000,
            'content' => ['items' => [['description' => 'A', 'month' => '', 'amount' => 1000]]],
            'created_by' => $user->id,
        ]);

        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'view']);

        $response = $this->actingAs($staff)->get("/invoices/{$invoice->id}/pdf");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_staff_without_invoice_access_cannot_download_pdf(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $user = User::factory()->create();
        $invoice = Invoice::create([
            'number' => 'INV/PSDEV/001/05/09/2026',
            'sequence' => 1,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => '2026-09-05',
            'total' => 1000,
            'content' => ['items' => [['description' => 'A', 'month' => '', 'amount' => 1000]]],
            'created_by' => $user->id,
        ]);

        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get("/invoices/{$invoice->id}/pdf")->assertForbidden();
    }
}
