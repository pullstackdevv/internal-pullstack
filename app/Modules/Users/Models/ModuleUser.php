<?php

namespace App\Modules\Users\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleUser extends Model
{
    protected $table = 'module_user';

    protected $fillable = ['user_id', 'module', 'level'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
