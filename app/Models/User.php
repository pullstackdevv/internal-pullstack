<?php

namespace App\Models;

use App\Modules\Users\Models\ModuleUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'is_active'];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function moduleAccess(): HasMany
    {
        return $this->hasMany(ModuleUser::class);
    }

    public function levelFor(string $module): ?string
    {
        return $this->moduleAccess->firstWhere('module', $module)?->level;
    }
}
