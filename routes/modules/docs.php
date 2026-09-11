<?php

use App\Modules\Docs\Http\Controllers\DocCategoryController;
use App\Modules\Docs\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:docs,view'])->group(function () {
    Route::get('/doc-categories', [DocCategoryController::class, 'index'])->name('doc-categories.index');
    Route::get('/docs', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/docs/{slug}', [DocumentController::class, 'show'])->name('documents.show');
});

Route::middleware(['auth', 'module:docs,manage'])->group(function () {
    Route::post('/doc-categories', [DocCategoryController::class, 'store'])->name('doc-categories.store');
    Route::put('/doc-categories/{docCategory}', [DocCategoryController::class, 'update'])->name('doc-categories.update');
    Route::delete('/doc-categories/{docCategory}', [DocCategoryController::class, 'destroy'])->name('doc-categories.destroy');

    // GET create/edit live under /docs-manage to avoid ambiguity with the
    // GET /docs/{slug} show route above (same HTTP verb, single/segmented path).
    // POST/PUT/DELETE stay under /docs since a differing HTTP verb never
    // collides with the GET /docs/{slug} route.
    Route::get('/docs-manage/create', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/docs', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/docs-manage/{document}/edit', [DocumentController::class, 'edit'])->name('documents.edit');
    Route::put('/docs/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/docs/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
});
