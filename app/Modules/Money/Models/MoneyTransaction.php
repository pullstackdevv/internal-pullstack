<?php

namespace App\Modules\Money\Models;

use App\Models\User;
use App\Modules\Invoice\Models\Invoice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoneyTransaction extends Model
{
    protected $fillable = [
        'wallet_id', 'category_id', 'type', 'amount', 'date', 'note',
        'invoice_id', 'transfer_id', 'created_by',
    ];

    protected $casts = [
        'amount' => 'integer',
        'date' => 'date',
    ];

    public const TYPES = ['income', 'expense'];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(MoneyWallet::class, 'wallet_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MoneyCategory::class, 'category_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Signed contribution to a wallet balance: +income, -expense. */
    public function signedAmount(): int
    {
        return $this->type === 'income' ? $this->amount : -$this->amount;
    }
}
