<?php

namespace App\Modules\Money\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoneyBudget extends Model
{
    protected $fillable = ['category_id', 'month', 'amount'];

    protected $casts = ['amount' => 'integer'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class, 'category_id');
    }
}
