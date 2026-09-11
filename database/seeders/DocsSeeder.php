<?php

namespace Database\Seeders;

use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Database\Seeder;

class DocsSeeder extends Seeder
{
    public function run(): void
    {
        $category = DocCategory::firstOrCreate(
            ['slug' => 'infrastructure'],
            ['name' => 'Infrastructure', 'position' => 0]
        );

        $path = base_path('blueprint.md');

        if (! file_exists($path)) {
            return;
        }

        Document::updateOrCreate(
            ['slug' => 'vps-deployment'],
            [
                'doc_category_id' => $category->id,
                'title' => 'VPS Deployment Guide',
                'excerpt' => 'Setup Ubuntu 22.04 + aaPanel + Docker (Grafana, Jenkins, n8n) + Nginx',
                'body_markdown' => file_get_contents($path),
                'is_published' => true,
                'position' => 0,
            ]
        );
    }
}
