<?php

namespace Database\Seeders;

use App\Modules\Money\Models\MoneyCategory;
use Illuminate\Database\Seeder;

class MoneyCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Pemasukan khas bisnis Pullstack
            ['name' => 'Jasa Deployment', 'kind' => 'income', 'color' => '#16a34a'],
            ['name' => 'Maintenance', 'kind' => 'income', 'color' => '#059669'],
            ['name' => 'Konsultasi', 'kind' => 'income', 'color' => '#0ea5e9'],
            ['name' => 'Lainnya', 'kind' => 'income', 'color' => '#64748b'],
            // Pengeluaran khas bisnis Pullstack
            ['name' => 'Server & VPS', 'kind' => 'expense', 'color' => '#dc2626'],
            ['name' => 'Domain & SSL', 'kind' => 'expense', 'color' => '#ea580c'],
            ['name' => 'Tools & Lisensi', 'kind' => 'expense', 'color' => '#7c3aed'],
            ['name' => 'Operasional', 'kind' => 'expense', 'color' => '#d97706'],
            ['name' => 'Transport', 'kind' => 'expense', 'color' => '#0891b2'],
            ['name' => 'Lainnya', 'kind' => 'expense', 'color' => '#64748b'],
        ];

        foreach ($categories as $category) {
            MoneyCategory::updateOrCreate(
                ['name' => $category['name'], 'kind' => $category['kind']],
                ['color' => $category['color'], 'is_active' => true],
            );
        }
    }
}
