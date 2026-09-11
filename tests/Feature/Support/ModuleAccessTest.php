<?php

namespace Tests\Feature\Support;

use App\Models\User;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ModuleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['web', 'auth', 'module:docs,view'])
            ->get('/_test/docs-view', fn () => 'ok');

        Route::middleware(['web', 'auth', 'module:docs,manage'])
            ->post('/_test/docs-manage', fn () => 'ok');
    }

    public function test_admin_bypasses_module_check_without_assignment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->get('/_test/docs-view')->assertOk();
        $this->actingAs($admin)->post('/_test/docs-manage')->assertOk();
    }

    public function test_staff_without_assignment_is_forbidden(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get('/_test/docs-view')->assertForbidden();
    }

    public function test_staff_with_view_level_cannot_reach_manage_route(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'view']);

        $this->actingAs($staff)->get('/_test/docs-view')->assertOk();
        $this->actingAs($staff)->post('/_test/docs-manage')->assertForbidden();
    }

    public function test_staff_with_manage_level_reaches_both(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'docs', 'level' => 'manage']);

        $this->actingAs($staff)->get('/_test/docs-view')->assertOk();
        $this->actingAs($staff)->post('/_test/docs-manage')->assertOk();
    }
}
