<?php

namespace App\Modules\Money\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MoneyCategory extends Model
{
    protected $fillable = ['name', 'kind', 'color', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public const KINDS = ['income', 'expense'];

    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'category_id');
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(MoneyBudget::class, 'category_id');
    }
}
