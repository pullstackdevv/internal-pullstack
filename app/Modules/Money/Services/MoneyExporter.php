<?php

namespace App\Modules\Money\Services;

use App\Modules\Money\Models\MoneyTransaction;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MoneyExporter
{
    /** @return array<int, array<int, string|int>> header row + one row per transaction */
    public function rows(string $month): array
    {
        [$year, $mon] = array_map('intval', explode('-', $month));

        $rows = [['Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Catatan', 'Nominal (Rp)']];

        MoneyTransaction::with(['wallet', 'category'])
            ->whereYear('date', $year)->whereMonth('date', $mon)
            ->orderBy('date')->orderBy('id')
            ->each(function (MoneyTransaction $tx) use (&$rows) {
                $rows[] = [
                    $tx->date->format('Y-m-d'),
                    $tx->type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                    $tx->category?->name ?? '',
                    $tx->wallet?->name ?? '',
                    $tx->note ?? '',
                    $tx->type === 'income' ? $tx->amount : -$tx->amount,
                ];
            });

        return $rows;
    }

    public function csvResponse(string $month): StreamedResponse
    {
        $rows = $this->rows($month);

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, "keuangan-{$month}.csv", ['Content-Type' => 'text/csv']);
    }

    /** Tab-separated values, ready to paste into Google Sheets. */
    public function tsv(string $month): string
    {
        return collect($this->rows($month))
            ->map(fn (array $row) => implode("\t", array_map(fn ($v) => str_replace(["\t", "\n"], ' ', (string) $v), $row)))
            ->implode("\n");
    }
}
