<?php

use App\Modules\Money\Http\Controllers\Api\MoneyApiController;
use Illuminate\Support\Facades\Route;

/*
| Money Management API — consumed by the MCP server in /mcp.
| Auth: Sanctum bearer token; per-endpoint abilities are enforced in the
| controller (money:read / money:write / money:export / money:admin).
*/
Route::middleware('auth:sanctum')->prefix('money')->group(function () {
    Route::get('/balance', [MoneyApiController::class, 'balance']);
    Route::get('/transactions', [MoneyApiController::class, 'transactionsIndex']);
    Route::post('/transactions', [MoneyApiController::class, 'transactionsStore']);
    Route::patch('/transactions/{transaction}', [MoneyApiController::class, 'transactionsUpdate']);
    Route::delete('/transactions/{transaction}', [MoneyApiController::class, 'transactionsDestroy']);
    Route::get('/summary', [MoneyApiController::class, 'summary']);
    Route::get('/budgets', [MoneyApiController::class, 'budgets']);
    Route::get('/categories', [MoneyApiController::class, 'categoriesIndex']);
    Route::post('/categories', [MoneyApiController::class, 'categoriesStore']);
    Route::get('/wallets', [MoneyApiController::class, 'walletsIndex']);
    Route::post('/wallets', [MoneyApiController::class, 'walletsStore']);
    Route::get('/export', [MoneyApiController::class, 'export']);
    Route::get('/export.csv', [MoneyApiController::class, 'export']);
});
