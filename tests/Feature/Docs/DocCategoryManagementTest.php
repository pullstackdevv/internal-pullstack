<?php

namespace Tests\Feature\Docs;

use App\Models\User;
use App\Modules\Docs\Models\DocCategory;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocCategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/doc-categories')->assertRedirect('/login');
    }

    public function test_staff_without_docs_access_is_forbidden(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get('/doc-categories')->assertForbidden();
    }

    public function test_view_level_staff_cannot_create_category(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'view']);

        $this->actingAs($staff)->post('/doc-categories', ['name' => 'Infra'])->assertForbidden();
    }

    public function test_manage_level_staff_can_create_category(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'manage']);

        $response = $this->actingAs($staff)->post('/doc-categories', ['name' => 'Infrastructure']);

        $response->assertRedirect('/doc-categories');
        $this->assertDatabaseHas('doc_categories', ['name' => 'Infrastructure', 'slug' => 'infrastructure']);
    }

    public function test_admin_can_update_and_delete_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = DocCategory::create(['name' => 'Old']);

        $this->actingAs($admin)->put("/doc-categories/{$category->id}", ['name' => 'New'])
            ->assertRedirect('/doc-categories');
        $this->assertDatabaseHas('doc_categories', ['id' => $category->id, 'name' => 'New']);

        $this->actingAs($admin)->delete("/doc-categories/{$category->id}")
            ->assertRedirect('/doc-categories');
        $this->assertDatabaseMissing('doc_categories', ['id' => $category->id]);
    }
}
