<?php

namespace App\Modules\Invoice\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'number', 'sequence', 'client_id', 'client_name',
        'issue_date', 'total', 'content', 'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'total' => 'decimal:2',
        'content' => 'array',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): array
    {
        return $this->content['items'] ?? [];
    }
}
