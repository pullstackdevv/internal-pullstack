<?php

namespace App\Modules\Money\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoneyRecurring extends Model
{
    protected $table = 'money_recurring';

    protected $fillable = [
        'name', 'wallet_id', 'category_id', 'type', 'amount',
        'day_of_month', 'is_active', 'last_generated_month',
    ];

    protected $casts = [
        'amount' => 'integer',
        'day_of_month' => 'integer',
        'is_active' => 'boolean',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(MoneyWallet::class, 'wallet_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class, 'category_id');
    }
}
