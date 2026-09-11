<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_access_settings(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get('/settings')->assertForbidden();
    }

    public function test_admin_can_update_issuer_setting(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->put('/settings/invoice.issuer', [
            'content' => [
                'name' => 'Pullstack Dev',
                'address' => 'Sleman, Yogyakarta, Indonesia',
                'phone' => '+62 823-2272-5764',
                'email' => 'pullstack.devv@gmail.com',
            ],
        ]);

        $response->assertRedirect('/settings');
        $this->assertDatabaseHas('settings', ['code' => 'invoice.issuer']);
    }
}
