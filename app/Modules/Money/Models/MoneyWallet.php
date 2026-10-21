<?php

namespace App\Modules\Money\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MoneyWallet extends Model
{
    protected $fillable = ['name', 'type', 'opening_balance', 'is_active'];

    protected $casts = [
        'opening_balance' => 'integer',
        'is_active' => 'boolean',
    ];

    public const TYPES = ['cash', 'bank', 'ewallet', 'other'];

    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'wallet_id');
    }
}
