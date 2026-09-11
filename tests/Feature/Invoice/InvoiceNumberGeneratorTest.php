<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Invoice\Services\InvoiceNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_invoice_gets_sequence_one(): void
    {
        $result = app(InvoiceNumberGenerator::class)->next(new \DateTime('2026-09-05'));

        $this->assertSame(1, $result['sequence']);
        $this->assertSame('INV/PSDEV/001/05/09/2026', $result['number']);
    }

    public function test_sequence_keeps_incrementing_across_years(): void
    {
        $this->createInvoiceWithSequence(6, '2026-09-05');

        $result = app(InvoiceNumberGenerator::class)->next(new \DateTime('2027-01-10'));

        $this->assertSame(7, $result['sequence']);
        $this->assertSame('INV/PSDEV/007/10/01/2027', $result['number']);
    }

    public function test_number_and_sequence_are_unique_in_database(): void
    {
        $this->createInvoiceWithSequence(1, '2026-09-05');

        $this->expectException(\Illuminate\Database\QueryException::class);

        $this->createInvoiceWithSequence(1, '2026-09-06');
    }

    private function createInvoiceWithSequence(int $sequence, string $date): Invoice
    {
        $client = Client::create(['name' => 'Client']);
        $user = User::factory()->create();

        return Invoice::create([
            'number' => sprintf('INV/PSDEV/%03d/%s', $sequence, date('d/m/Y', strtotime($date))),
            'sequence' => $sequence,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => $date,
            'total' => 0,
            'content' => ['items' => []],
            'created_by' => $user->id,
        ]);
    }
}
