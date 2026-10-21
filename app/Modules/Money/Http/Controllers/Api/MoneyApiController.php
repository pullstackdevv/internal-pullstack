<?php

namespace App\Modules\Money\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Money\Http\Requests\StoreMoneyTransactionRequest;
use App\Modules\Money\Http\Requests\UpdateMoneyTransactionRequest;
use App\Modules\Money\Models\MoneyCategory;
use App\Modules\Money\Models\MoneyTransaction;
use App\Modules\Money\Models\MoneyWallet;
use App\Modules\Money\Services\MoneyExporter;
use App\Modules\Money\Services\MoneySummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * REST API for external agents (consumed by the MCP server in /mcp).
 * Every endpoint requires a Sanctum bearer token with the matching
 * ability: money:read / money:write / money:export / money:admin.
 */
class MoneyApiController extends Controller
{
    public function __construct(
        private readonly MoneySummary $summary,
        private readonly MoneyExporter $exporter,
    ) {}

    private function requireAbility(Request $request, string $ability): void
    {
        $user = $request->user();

        abort_if(! $user || ! $user->is_active, 403, 'Akun tidak aktif.');

        if (! $user->tokenCan($ability)) {
            abort(response()->json([
                'message' => "Token tidak memiliki permission {$ability}. Buat token dengan scope tersebut di halaman Token MCP.",
            ], 403));
        }
    }

    private function presentTransaction(MoneyTransaction $tx): array
    {
        $tx->loadMissing(['wallet', 'category']);

        return [
            'id' => $tx->id,
            'wallet_id' => $tx->wallet_id,
            'wallet_name' => $tx->wallet?->name,
            'category_id' => $tx->category_id,
            'category_name' => $tx->category?->name,
            'category_color' => $tx->category?->color,
            'type' => $tx->type,
            'amount' => $tx->amount,
            'date' => $tx->date->format('Y-m-d'),
            'note' => $tx->note,
            'invoice_id' => $tx->invoice_id,
            'transfer_id' => $tx->transfer_id,
            'created_by' => $tx->created_by,
        ];
    }

    private function presentWallet(MoneyWallet $wallet): array
    {
        return [
            'id' => $wallet->id,
            'name' => $wallet->name,
            'type' => $wallet->type,
            'opening_balance' => (int) $wallet->opening_balance,
            'balance' => $this->summary->walletBalance($wallet),
            'is_active' => (bool) $wallet->is_active,
        ];
    }

    public function balance(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        return response()->json([
            'data' => [
                'total_balance' => $this->summary->totalBalance(),
                'wallets' => $this->summary->walletsWithBalance()
                    ->map(fn (MoneyWallet $w) => [
                        'id' => $w->id,
                        'name' => $w->name,
                        'type' => $w->type,
                        'opening_balance' => (int) $w->opening_balance,
                        'balance' => $w->balance,
                        'is_active' => (bool) $w->is_active,
                    ])
                    ->values()
                    ->all(),
            ],
        ]);
    }

    public function transactionsIndex(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        $query = MoneyTransaction::with(['wallet', 'category'])->orderByDesc('date')->orderByDesc('id');

        if ($month = $request->query('month')) {
            [$year, $mon] = array_map('intval', explode('-', $month));
            $query->whereYear('date', $year)->whereMonth('date', $mon);
        }
        if ($walletId = $request->query('wallet_id')) {
            $query->where('wallet_id', $walletId);
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }
        if ($q = $request->query('q')) {
            $query->where('note', 'like', "%{$q}%");
        }

        $perPage = min(max((int) $request->query('per_page', 25), 1), 100);
        $page = $query->paginate($perPage);

        return response()->json([
            'data' => collect($page->items())->map(fn (MoneyTransaction $tx) => $this->presentTransaction($tx))->all(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function transactionsStore(StoreMoneyTransactionRequest $request): JsonResponse
    {
        $this->requireAbility($request, 'money:write');

        $data = $request->validated();
        $markPaid = $data['mark_paid'] ?? false;
        unset($data['mark_paid']);
        $data['created_by'] = $request->user()->id;

        $tx = MoneyTransaction::create($data);

        if ($markPaid && ! empty($data['invoice_id'])) {
            Invoice::where('id', $data['invoice_id'])->update(['status' => 'paid']);
        }

        return response()->json(['data' => $this->presentTransaction($tx)], 201);
    }

    public function transactionsUpdate(UpdateMoneyTransactionRequest $request, MoneyTransaction $transaction): JsonResponse
    {
        $this->requireAbility($request, 'money:write');

        $data = $request->validated();
        $markPaid = $data['mark_paid'] ?? false;
        unset($data['mark_paid']);

        $transaction->update($data);

        if ($markPaid && $transaction->invoice_id) {
            Invoice::where('id', $transaction->invoice_id)->update(['status' => 'paid']);
        }

        return response()->json(['data' => $this->presentTransaction($transaction->fresh())]);
    }

    public function transactionsDestroy(Request $request, MoneyTransaction $transaction): JsonResponse
    {
        $this->requireAbility($request, 'money:write');

        $transaction->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function summary(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        $month = (string) $request->query('month', now()->format('Y-m'));

        return response()->json(['data' => $this->summary->summary($month)]);
    }

    public function budgets(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        $month = (string) $request->query('month', now()->format('Y-m'));

        return response()->json(['data' => $this->summary->budgetStatus($month)]);
    }

    public function categoriesIndex(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        return response()->json([
            'data' => MoneyCategory::orderBy('kind')->orderBy('name')->get()
                ->map(fn (MoneyCategory $c) => [
                    'id' => $c->id, 'name' => $c->name, 'kind' => $c->kind,
                    'color' => $c->color, 'is_active' => (bool) $c->is_active,
                ])->all(),
        ]);
    }

    public function categoriesStore(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:admin');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'kind' => ['required', 'in:income,expense'],
            'color' => ['nullable', 'string', 'max:9'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category = MoneyCategory::create($data);

        return response()->json(['data' => [
            'id' => $category->id, 'name' => $category->name, 'kind' => $category->kind,
            'color' => $category->color, 'is_active' => (bool) $category->is_active,
        ]], 201);
    }

    public function walletsIndex(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:read');

        return response()->json([
            'data' => MoneyWallet::orderBy('name')->get()
                ->map(fn (MoneyWallet $w) => $this->presentWallet($w))->all(),
        ]);
    }

    public function walletsStore(Request $request): JsonResponse
    {
        $this->requireAbility($request, 'money:admin');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:cash,bank,ewallet,other'],
            'opening_balance' => ['nullable', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $wallet = MoneyWallet::create($data);

        return response()->json(['data' => $this->presentWallet($wallet)], 201);
    }

    public function export(Request $request): StreamedResponse
    {
        $this->requireAbility($request, 'money:export');

        $month = (string) $request->query('month', now()->format('Y-m'));

        return $this->exporter->csvResponse($month);
    }
}
