<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Exports\TransactionsExport;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Services\MoneyExporter;
use App\Modules\Money\Services\MoneySummary;
use App\Support\Settings\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MoneyReportController extends Controller
{
    public function __construct(
        private readonly MoneySummary $summary,
        private readonly MoneyExporter $exporter,
        private readonly Settings $settings,
    ) {}

    public function index(Request $request): Response
    {
        $month = (string) $request->query('month', now()->format('Y-m'));
        [$year, $mon] = array_map('intval', explode('-', $month));

        $issuer = $this->settings->get('invoice.issuer', ['name' => '']);

        $transactions = MoneyTransaction::with(['wallet', 'category'])
            ->whereYear('date', $year)->whereMonth('date', $mon)
            ->orderBy('date')->orderBy('id')
            ->get()
            ->map(fn (MoneyTransaction $tx) => [
                'id' => $tx->id,
                'date' => $tx->date->format('Y-m-d'),
                'type' => $tx->type,
                'amount' => $tx->amount,
                'note' => $tx->note,
                'wallet_name' => $tx->wallet?->name,
                'category_name' => $tx->category?->name,
                'category_color' => $tx->category?->color,
            ]);

        return Inertia::render('money/report/index', [
            'month' => $month,
            'companyName' => $issuer['name'] ?: 'Pullstack',
            'summary' => $this->summary->summary($month),
            'transactions' => $transactions,
            'tsv' => $this->exporter->tsv($month),
            'sheetsWebhookUrl' => $this->sheetsWebhookUrl(),
            'sheetsResult' => session('sheets_result'),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $month = (string) $request->query('month', now()->format('Y-m'));

        return $this->exporter->csvResponse($month);
    }

    public function exportXlsx(Request $request): BinaryFileResponse
    {
        $month = (string) $request->query('month', now()->format('Y-m'));

        return Excel::download(new TransactionsExport($month), "keuangan-{$month}.xlsx");
    }

    public function updateSheetsSettings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'webhook_url' => ['nullable', 'url', 'max:500'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        $this->settings->set('money.integrations', [
            'google_sheets_webhook_url' => $data['webhook_url'] ?? '',
        ]);

        return redirect()->route('money.report.index', ['month' => $data['month'] ?? now()->format('Y-m')]);
    }

    /**
     * Push the month's transactions to the user's Google Apps Script Web App,
     * which appends them to their spreadsheet. No Google credentials are
     * involved on our side — the Web App URL itself is the credential.
     */
    public function sendToGoogleSheets(Request $request): RedirectResponse
    {
        $month = (string) $request->input('month', now()->format('Y-m'));
        $url = $this->sheetsWebhookUrl();

        if (! $url) {
            return back()->with('sheets_result', [
                'ok' => false,
                'message' => 'URL Web App Google Sheets belum diatur.',
            ]);
        }

        [$year, $mon] = array_map('intval', explode('-', $month));

        $transactions = MoneyTransaction::with(['wallet', 'category'])
            ->whereYear('date', $year)->whereMonth('date', $mon)
            ->orderBy('date')->orderBy('id')
            ->get()
            ->map(fn (MoneyTransaction $tx) => [
                'date' => $tx->date->format('Y-m-d'),
                'type' => $tx->type,
                'category' => $tx->category?->name ?? '',
                'wallet' => $tx->wallet?->name ?? '',
                'note' => $tx->note ?? '',
                'amount' => $tx->type === 'income' ? $tx->amount : -$tx->amount,
            ])
            ->all();

        try {
            $response = Http::timeout(20)->post($url, [
                'month' => $month,
                'transactions' => $transactions,
            ]);

            $result = $response->successful()
                ? ['ok' => true, 'message' => "Terkirim ke Google Sheets ({$response->status()}): ".count($transactions).' transaksi bulan '.$month.'.']
                : ['ok' => false, 'message' => "Google Sheets merespons {$response->status()}. Periksa URL Web App dan deployment Apps Script."];
        } catch (\Throwable $e) {
            $result = ['ok' => false, 'message' => 'Gagal menghubungi Google Sheets: '.$e->getMessage()];
        }

        return back()->with('sheets_result', $result);
    }

    private function sheetsWebhookUrl(): string
    {
        $integration = $this->settings->get('money.integrations', []);

        return (string) ($integration['google_sheets_webhook_url'] ?? '');
    }
}
