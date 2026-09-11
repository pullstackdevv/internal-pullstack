<?php

namespace Tests\Feature\Support;

use App\Support\Settings\Settings;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_returns_default_when_missing(): void
    {
        $result = app(Settings::class)->get('invoice.issuer', ['name' => '']);

        $this->assertSame(['name' => ''], $result);
    }

    public function test_set_then_get_returns_saved_content(): void
    {
        app(Settings::class)->set('invoice.issuer', ['name' => 'Pullstack Dev']);

        $result = app(Settings::class)->get('invoice.issuer');

        $this->assertSame(['name' => 'Pullstack Dev'], $result);
    }

    public function test_set_twice_updates_same_row(): void
    {
        app(Settings::class)->set('invoice.issuer', ['name' => 'A']);
        app(Settings::class)->set('invoice.issuer', ['name' => 'B']);

        $this->assertSame(1, \DB::table('settings')->where('code', 'invoice.issuer')->count());
        $this->assertSame(['name' => 'B'], app(Settings::class)->get('invoice.issuer'));
    }
}
