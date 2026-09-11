<?php

namespace App\Support\Modules;

use App\Models\User;

class ModuleRegistry
{
    /**
     * @return array<int, array{key: string, label: string, href: string, icon: string}>
     */
    public static function all(): array
    {
        return [
            ['key' => 'docs', 'label' => 'Dokumentasi', 'href' => '/docs', 'icon' => 'book-open'],
            ['key' => 'invoice', 'label' => 'Invoice', 'href' => '/invoices', 'icon' => 'file-text'],
            ['key' => 'users', 'label' => 'Users', 'href' => '/users', 'icon' => 'users', 'adminOnly' => true],
            ['key' => 'settings', 'label' => 'Settings', 'href' => '/settings', 'icon' => 'settings', 'adminOnly' => true],
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, href: string, icon: string}>
     */
    public static function visibleFor(User $user): array
    {
        return array_values(array_filter(self::all(), function (array $module) use ($user) {
            if (! empty($module['adminOnly'])) {
                return $user->isAdmin();
            }

            return $user->isAdmin() || $user->levelFor($module['key']) !== null;
        }));
    }
}
