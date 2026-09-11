<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_without_invoice_access_is_forbidden(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get('/clients')->assertForbidden();
    }

    public function test_view_level_staff_cannot_create_client(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'view']);

        $this->actingAs($staff)->post('/clients', ['name' => 'Kolegium'])->assertForbidden();
    }

    public function test_manage_level_staff_can_create_client(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'manage']);

        $response = $this->actingAs($staff)->post('/clients', [
            'name' => 'Kolegium Orthopedi dan Traumatologi Indonesia',
        ]);

        $response->assertRedirect('/clients');
        $this->assertDatabaseHas('clients', ['name' => 'Kolegium Orthopedi dan Traumatologi Indonesia']);
    }

    public function test_deleting_client_is_soft_delete(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = Client::create(['name' => 'Client A']);

        $this->actingAs($admin)->delete("/clients/{$client->id}")->assertRedirect('/clients');

        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }
}
