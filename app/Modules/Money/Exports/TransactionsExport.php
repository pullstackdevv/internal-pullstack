<?php

namespace App\Modules\Money\Exports;

use App\Modules\Money\Services\MoneyExporter;
use Maatwebsite\Excel\Concerns\FromArray;

class TransactionsExport implements FromArray
{
    public function __construct(private readonly string $month) {}

    public function array(): array
    {
        return app(MoneyExporter::class)->rows($this->month);
    }
}
