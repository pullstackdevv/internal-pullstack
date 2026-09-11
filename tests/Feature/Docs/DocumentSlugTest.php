<?php

namespace Tests\Feature\Docs;

use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Tests\TestCase;

class DocumentSlugTest extends TestCase
{
    use RefreshDatabase;

    public function test_slug_generated_from_title_when_not_provided(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);

        $document = Document::create([
            'doc_category_id' => $category->id,
            'title' => 'VPS Deployment Guide',
            'body_markdown' => '# Hello',
        ]);

        $this->assertSame('vps-deployment-guide', $document->slug);
    }

    public function test_slug_must_be_unique(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Guide',
            'slug' => 'guide',
            'body_markdown' => '# A',
        ]);

        $this->expectException(QueryException::class);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Another Guide',
            'slug' => 'guide',
            'body_markdown' => '# B',
        ]);
    }
}
