<?php

use App\Modules\Money\Http\Controllers\MoneyApiTokenController;
use App\Modules\Money\Http\Controllers\MoneyBudgetController;
use App\Modules\Money\Http\Controllers\MoneyCategoryController;
use App\Modules\Money\Http\Controllers\MoneyDashboardController;
use App\Modules\Money\Http\Controllers\MoneyReportController;
use App\Modules\Money\Http\Controllers\MoneyTransactionController;
use App\Modules\Money\Http\Controllers\MoneyWalletController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:money,view'])->group(function () {
    Route::get('/money', [MoneyDashboardController::class, 'index'])->name('money.index');
    Route::get('/money/transactions', [MoneyTransactionController::class, 'index'])->name('money.transactions.index');
    Route::get('/money/wallets', [MoneyWalletController::class, 'index'])->name('money.wallets.index');
    Route::get('/money/categories', [MoneyCategoryController::class, 'index'])->name('money.categories.index');
    Route::get('/money/budgets', [MoneyBudgetController::class, 'index'])->name('money.budgets.index');
    Route::get('/money/report', [MoneyReportController::class, 'index'])->name('money.report.index');
    Route::get('/money/report/export.csv', [MoneyReportController::class, 'exportCsv'])->name('money.report.csv');
    Route::get('/money/report/export.xlsx', [MoneyReportController::class, 'exportXlsx'])->name('money.report.xlsx');
    Route::get('/money/api-tokens', [MoneyApiTokenController::class, 'index'])->name('money.api-tokens.index');
});

Route::middleware(['auth', 'module:money,manage'])->group(function () {
    Route::get('/money/transactions/create', [MoneyTransactionController::class, 'create'])->name('money.transactions.create');
    Route::post('/money/transactions', [MoneyTransactionController::class, 'store'])->name('money.transactions.store');
    Route::get('/money/transactions/{transaction}/edit', [MoneyTransactionController::class, 'edit'])->name('money.transactions.edit');
    Route::put('/money/transactions/{transaction}', [MoneyTransactionController::class, 'update'])->name('money.transactions.update');
    Route::delete('/money/transactions/{transaction}', [MoneyTransactionController::class, 'destroy'])->name('money.transactions.destroy');

    Route::post('/money/wallets', [MoneyWalletController::class, 'store'])->name('money.wallets.store');
    Route::put('/money/wallets/{wallet}', [MoneyWalletController::class, 'update'])->name('money.wallets.update');
    Route::delete('/money/wallets/{wallet}', [MoneyWalletController::class, 'destroy'])->name('money.wallets.destroy');
    Route::post('/money/wallets/transfer', [MoneyWalletController::class, 'transfer'])->name('money.wallets.transfer');

    Route::post('/money/categories', [MoneyCategoryController::class, 'store'])->name('money.categories.store');
    Route::put('/money/categories/{category}', [MoneyCategoryController::class, 'update'])->name('money.categories.update');
    Route::delete('/money/categories/{category}', [MoneyCategoryController::class, 'destroy'])->name('money.categories.destroy');

    Route::post('/money/budgets', [MoneyBudgetController::class, 'store'])->name('money.budgets.store');
    Route::post('/money/budgets/recurring', [MoneyBudgetController::class, 'storeRecurring'])->name('money.recurring.store');
    Route::delete('/money/budgets/recurring/{recurring}', [MoneyBudgetController::class, 'destroyRecurring'])->name('money.recurring.destroy');
    Route::post('/money/budgets/generate-recurring', [MoneyBudgetController::class, 'generateRecurring'])->name('money.recurring.generate');

    Route::post('/money/report/send-sheets', [MoneyReportController::class, 'sendToGoogleSheets'])->name('money.report.send-sheets');
    Route::put('/money/report/sheets-settings', [MoneyReportController::class, 'updateSheetsSettings'])->name('money.report.sheets-settings');

    Route::post('/money/api-tokens', [MoneyApiTokenController::class, 'store'])->name('money.api-tokens.store');
    Route::delete('/money/api-tokens/{token}', [MoneyApiTokenController::class, 'destroy'])->name('money.api-tokens.destroy');
});
