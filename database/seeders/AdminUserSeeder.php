<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@pullstack.cloud'],
            [
                'name' => 'Admin',
                'password' => Hash::make('ubah-password-ini'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
