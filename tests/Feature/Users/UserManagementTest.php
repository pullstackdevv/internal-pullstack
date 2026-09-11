<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_access_user_management(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get('/users')->assertForbidden();
    }

    public function test_admin_can_create_user_with_module_access(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/users', [
            'name' => 'Staff Satu',
            'email' => 'staff1@pullstack.cloud',
            'password' => 'password123',
            'role' => 'staff',
            'module_access' => [
                ['module' => 'docs', 'level' => 'view'],
                ['module' => 'invoice', 'level' => 'manage'],
            ],
        ]);

        $response->assertRedirect('/users');
        $this->assertDatabaseHas('users', ['email' => 'staff1@pullstack.cloud', 'role' => 'staff']);
        $this->assertDatabaseHas('module_user', ['module' => 'docs', 'level' => 'view']);
        $this->assertDatabaseHas('module_user', ['module' => 'invoice', 'level' => 'manage']);
    }

    public function test_admin_can_update_user_module_access(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff']);

        $response = $this->actingAs($admin)->put("/users/{$staff->id}", [
            'name' => $staff->name,
            'email' => $staff->email,
            'role' => 'staff',
            'is_active' => true,
            'module_access' => [['module' => 'docs', 'level' => 'manage']],
        ]);

        $response->assertRedirect('/users');
        $this->assertDatabaseHas('module_user', [
            'user_id' => $staff->id,
            'module' => 'docs',
            'level' => 'manage',
        ]);
    }

    public function test_admin_can_deactivate_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff', 'is_active' => true]);

        $this->actingAs($admin)->delete("/users/{$staff->id}")->assertRedirect('/users');

        $this->assertFalse($staff->fresh()->is_active);
    }
}
