<?php

use App\Modules\Settings\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('/settings/{code}', [SettingController::class, 'update'])->name('settings.update')
        ->where('code', 'invoice\.issuer|invoice\.payment');
});
