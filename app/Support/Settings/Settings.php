<?php

namespace App\Support\Settings;

use App\Modules\Settings\Models\Setting;

class Settings
{
    public function get(string $code, array $default = []): array
    {
        $setting = Setting::where('code', $code)->first();

        return $setting?->content ?? $default;
    }

    public function set(string $code, array $content): void
    {
        Setting::updateOrCreate(['code' => $code], ['content' => $content]);
    }
}
