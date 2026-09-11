<?php

use App\Modules\Docs\Http\Controllers\DocCategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:docs,view'])->group(function () {
    Route::get('/doc-categories', [DocCategoryController::class, 'index'])->name('doc-categories.index');
});

Route::middleware(['auth', 'module:docs,manage'])->group(function () {
    Route::post('/doc-categories', [DocCategoryController::class, 'store'])->name('doc-categories.store');
    Route::put('/doc-categories/{docCategory}', [DocCategoryController::class, 'update'])->name('doc-categories.update');
    Route::delete('/doc-categories/{docCategory}', [DocCategoryController::class, 'destroy'])->name('doc-categories.destroy');
});
