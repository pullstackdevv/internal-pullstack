<?php

namespace App\Modules\Invoice\Services;

use App\Modules\Invoice\Models\Invoice;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

class InvoiceNumberGenerator
{
    /**
     * @return array{number: string, sequence: int}
     */
    public function next(DateTimeInterface $issueDate): array
    {
        return DB::transaction(function () use ($issueDate) {
            $lastSequence = Invoice::lockForUpdate()->max('sequence') ?? 0;
            $sequence = $lastSequence + 1;

            $number = sprintf(
                'INV/PSDEV/%03d/%s',
                $sequence,
                $issueDate->format('d/m/Y')
            );

            return ['number' => $number, 'sequence' => $sequence];
        });
    }
}
