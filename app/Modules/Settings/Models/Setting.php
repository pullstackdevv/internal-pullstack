<?php

namespace App\Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['code', 'content'];

    protected $casts = ['content' => 'array'];
}
