<?php

use App\Modules\Invoice\Http\Controllers\ClientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:invoice,view'])->group(function () {
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
});

Route::middleware(['auth', 'module:invoice,manage'])->group(function () {
    Route::get('/clients/create', [ClientController::class, 'create'])->name('clients.create');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::get('/clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
});
