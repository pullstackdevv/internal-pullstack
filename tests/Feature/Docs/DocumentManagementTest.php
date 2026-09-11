<?php

namespace Tests\Feature\Docs;

use App\Models\User;
use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentManagementTest extends TestCase
{
    use RefreshDatabase;

    private function categoryWithDocuments(): DocCategory
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Published Doc',
            'body_markdown' => '# Published',
            'is_published' => true,
        ]);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Draft Doc',
            'body_markdown' => '# Draft',
            'is_published' => false,
        ]);

        return $category;
    }

    public function test_view_level_staff_only_sees_published_documents(): void
    {
        $this->categoryWithDocuments();
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'view']);

        $response = $this->actingAs($staff)->get('/docs');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('documents', 1)
            ->where('documents.0.title', 'Published Doc'));
    }

    public function test_manage_level_staff_sees_draft_documents_too(): void
    {
        $this->categoryWithDocuments();
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'manage']);

        $response = $this->actingAs($staff)->get('/docs');

        $response->assertInertia(fn ($page) => $page->has('documents', 2));
    }

    public function test_view_level_staff_cannot_open_draft_document_directly(): void
    {
        $category = $this->categoryWithDocuments();
        $draft = Document::where('title', 'Draft Doc')->first();
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'view']);

        $this->actingAs($staff)->get("/docs/{$draft->slug}")->assertNotFound();
    }

    public function test_manage_level_staff_can_create_document(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'manage']);

        $response = $this->actingAs($staff)->post('/docs', [
            'doc_category_id' => $category->id,
            'title' => 'New Doc',
            'body_markdown' => '# Hello',
            'is_published' => true,
        ]);

        $response->assertRedirect('/docs');
        $this->assertDatabaseHas('documents', ['title' => 'New Doc', 'created_by' => $staff->id]);
    }

    public function test_updating_document_records_updated_by(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);
        $document = Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Doc',
            'body_markdown' => '# A',
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->put("/docs/{$document->id}", [
            'doc_category_id' => $category->id,
            'title' => 'Doc Updated',
            'body_markdown' => '# B',
            'is_published' => true,
        ])->assertRedirect('/docs');

        $document->refresh();
        $this->assertSame('Doc Updated', $document->title);
        $this->assertSame($admin->id, $document->updated_by);
    }
}
