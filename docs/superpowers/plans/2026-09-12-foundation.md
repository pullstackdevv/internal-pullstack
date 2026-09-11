# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bongkar Vue/Mix, pasang React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui, dan bangun kerangka internal CMS: login, hak akses per-modul, layout sidebar, modul Users, modul Settings.

**Architecture:** Satu app Laravel dengan modul dipisah lewat folder (`app/Modules/*`), bukan sub-app terpisah. Middleware `module:<name>,<level>` menjaga tiap route group. `ModuleRegistry` jadi sumber tunggal untuk menu sidebar, difilter sesuai hak akses user yang login.

**Tech Stack:** Laravel 10 (tetap), React 19 + TypeScript, Inertia.js v2 (`@inertiajs/react`), Vite, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-12-internal-cms-design.md`

## Global Constraints

- Laravel tetap versi 10, PHP 8.1+ (spec §3).
- Tidak ada route register publik — user dibuat admin lewat modul Users (spec §5).
- Auth dibangun manual dengan `Auth` facade, tanpa `laravel/breeze` (spec §3, keputusan "auth tanpa Breeze").
- Modul tidak boleh meng-import kelas dari modul lain; kebutuhan bersama taruh di `app/Support` (spec §4, "Aturan batas").
- `Gate::before` meloloskan admin dari semua pengecekan — admin tidak pernah perlu di-assign modul (spec §5).
- Root `/` tidak pernah menampilkan halaman publik — mengarah ke login atau dashboard (spec §1).

---

## File Structure

**Backend (baru):**
- `database/migrations/*_add_role_and_is_active_to_users_table.php`
- `database/migrations/*_create_module_user_table.php`
- `database/migrations/*_create_settings_table.php`
- `app/Support/Settings/Settings.php` — helper `get(string $code, array $default = [])` / `set(string $code, array $content)`
- `app/Support/Modules/ModuleRegistry.php` — daftar modul statis + `visibleFor(User $user): array`
- `app/Http/Middleware/EnsureModuleAccess.php` — middleware `module:<name>,<level>`
- `app/Http/Controllers/Auth/LoginController.php`
- `app/Http/Requests/Auth/LoginRequest.php`
- `app/Http/Controllers/DashboardController.php`
- `app/Modules/Users/Models/ModuleUser.php`
- `app/Modules/Users/Http/Controllers/UserController.php`
- `app/Modules/Users/Http/Requests/StoreUserRequest.php`, `UpdateUserRequest.php`
- `app/Modules/Users/Policies/UserPolicy.php`
- `app/Modules/Settings/Models/Setting.php`
- `app/Modules/Settings/Http/Controllers/SettingController.php`
- `app/Modules/Settings/Http/Requests/UpdateSettingRequest.php`
- `routes/modules/users.php`, `routes/modules/settings.php`
- `database/seeders/AdminUserSeeder.php`

**Backend (dimodifikasi):**
- `app/Models/User.php` — tambah `role`, `is_active`, cast, relasi `moduleAccess()`
- `routes/web.php` — ditulis ulang, tipis
- `bootstrap/app.php` atau `app/Http/Kernel.php` — daftarkan middleware alias `module`
- `app/Providers/AuthServiceProvider.php` — `Gate::before` admin bypass

**Backend (dihapus):**
- `webpack.mix.js`
- `resources/js/Pages/Home.vue`, `resources/js/Pages/Documentation.vue`
- `resources/views/welcome.blade.php`
- `public/mix-manifest.json`, `public/js`, `public/css` (dibersihkan lewat `.gitignore` + hapus manual)

**Frontend (baru):**
- `tsconfig.json`
- `resources/js/app.tsx` (ganti `app.js`)
- `resources/js/lib/utils.ts` — `cn()` helper shadcn
- `resources/js/types/index.ts` — tipe `Auth`, `ModuleAccess`, `SharedProps`
- `resources/js/layouts/app-layout.tsx`
- `resources/js/components/app/page-header.tsx`
- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/dashboard.tsx`
- `resources/js/pages/users/index.tsx`, `create.tsx`, `edit.tsx`
- `resources/js/pages/settings/index.tsx`
- `resources/js/components/ui/*` — digenerate shadcn CLI (button, input, label, card, table, dialog, checkbox, select, sonner, separator, avatar, badge, form)
- `components.json` — konfigurasi shadcn

**Frontend (dihapus):**
- `resources/js/Pages/` (Vue), `resources/css/app.css` isi lama (ditulis ulang untuk Tailwind v4)

**Config (dimodifikasi):**
- `vite.config.js` — plugin React + Tailwind v4
- `package.json` — dependency diganti total
- `resources/views/app.blade.php` — `@vite` bukan `mix()`

---

### Task 1: Bongkar Vue/Mix, pasang toolchain React + Vite + Tailwind v4

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `tsconfig.json`
- Create: `resources/js/app.tsx`
- Delete: `webpack.mix.js`
- Delete: `resources/js/app.js`, `resources/js/Pages/Home.vue`, `resources/js/Pages/Documentation.vue`
- Modify: `resources/css/app.css`
- Modify: `.gitignore` (pastikan `/public/build` ada, hapus entry lama Mix kalau ada)

**Interfaces:**
- Produces: entry point Vite `resources/js/app.tsx` yang me-mount Inertia React app — dipakai semua task berikutnya sebagai satu-satunya entry.

- [ ] **Step 1: Hapus dependency Vue/Mix, tambah dependency baru di `package.json`**

```json
{
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build"
    },
    "devDependencies": {
        "@tailwindcss/vite": "^4.1.16",
        "@types/node": "^22.10.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.4",
        "laravel-vite-plugin": "^1.0.0",
        "tailwindcss": "^4.1.16",
        "typescript": "^5.7.0",
        "vite": "^5.4.0"
    },
    "dependencies": {
        "@inertiajs/react": "^2.0.0",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "lucide-react": "^0.468.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
        "react-markdown": "^9.0.1",
        "remark-gfm": "^4.0.0",
        "tailwind-merge": "^2.6.0",
        "tw-animate-css": "^1.0.0"
    }
}
```

- [ ] **Step 2: Hapus file/paket Vue-Mix**

```bash
rm -f webpack.mix.js resources/js/app.js
rm -f resources/js/Pages/Home.vue resources/js/Pages/Documentation.vue
rmdir resources/js/Pages 2>/dev/null || true
npm install
```

- [ ] **Step 3: Tulis `vite.config.js`**

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
});
```

- [ ] **Step 4: Tulis `tsconfig.json`**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "jsx": "react-jsx",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "noEmit": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["resources/js/*"]
        }
    },
    "include": ["resources/js"]
}
```

- [ ] **Step 5: Tulis entry point `resources/js/app.tsx`**

```tsx
import '../css/app.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        const page = pages[`./pages/${name}.tsx`] as { default: unknown };
        if (!page) {
            throw new Error(`Page not found: ./pages/${name}.tsx`);
        }
        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
```

- [ ] **Step 6: Tulis ulang `resources/css/app.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --radius: 0.625rem;
}

@theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --color-destructive: var(--destructive);
    --radius-lg: var(--radius);
    --radius-md: calc(var(--radius) - 2px);
    --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
    * {
        @apply border-border outline-ring/50;
    }
    body {
        @apply bg-background text-foreground;
    }
}
```

- [ ] **Step 7: Buat placeholder page supaya build tidak gagal karena `import.meta.glob` kosong**

```bash
mkdir -p resources/js/pages
```

```tsx
// resources/js/pages/dashboard.tsx (placeholder sementara, ditimpa Task 12)
export default function Dashboard() {
    return <div className="p-6">Dashboard</div>;
}
```

- [ ] **Step 8: Verifikasi build jalan**

Run: `npm run build`
Expected: sukses, muncul `public/build/manifest.json`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.js tsconfig.json resources/js/app.tsx resources/css/app.css resources/js/pages/dashboard.tsx .gitignore
git rm -f webpack.mix.js resources/js/app.js resources/js/Pages/Home.vue resources/js/Pages/Documentation.vue
git commit -m "chore: replace Laravel Mix + Vue with Vite + React + Tailwind v4"
```

---

### Task 2: shadcn/ui init + komponen dasar

**Files:**
- Create: `components.json`
- Modify: `resources/js/lib/utils.ts`
- Create: `resources/js/components/ui/*` (digenerate CLI)

**Interfaces:**
- Produces: komponen `Button`, `Input`, `Label`, `Card` (+ `CardHeader/Content/Footer/Title`), `Table` (+ turunannya), `Dialog`, `Checkbox`, `Select`, `Separator`, `Avatar`, `Badge`, `Sonner` (toast) — dipakai semua halaman berikutnya via `@/components/ui/<name>`.

- [ ] **Step 1: Tulis `components.json` manual (CLI init interaktif, jadi ditulis langsung)**

```json
{
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": {
        "config": "",
        "css": "resources/css/app.css",
        "baseColor": "neutral",
        "cssVariables": true,
        "prefix": ""
    },
    "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils",
        "ui": "@/components/ui",
        "lib": "@/lib",
        "hooks": "@/hooks"
    }
}
```

- [ ] **Step 2: Tulis `resources/js/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Generate komponen dasar via CLI**

```bash
npx shadcn@latest add button input label card table dialog checkbox select separator avatar badge sonner form textarea --yes
```

Kalau CLI gagal deteksi framework (karena bukan Next.js), pastikan `components.json` di atas sudah ada dulu sebelum run — CLI akan pakai config itu tanpa nanya interaktif.

- [ ] **Step 4: Verifikasi build tetap jalan**

Run: `npm run build`
Expected: sukses, tidak ada import error dari komponen shadcn.

- [ ] **Step 5: Commit**

```bash
git add components.json resources/js/lib/utils.ts resources/js/components/ui package.json package-lock.json
git commit -m "chore: init shadcn/ui base components"
```

---

### Task 3: Blade entry + root layout redirect

**Files:**
- Modify: `resources/views/app.blade.php`
- Modify: `routes/web.php`
- Create: `app/Http/Controllers/DashboardController.php` (stub redirect-only, isi penuh di Task 12)

**Interfaces:**
- Consumes: `resources/js/app.tsx` dari Task 1.
- Produces: route `/` yang mengarahkan guest ke `/login`, user login ke `/dashboard`.

- [ ] **Step 1: Tulis ulang `resources/views/app.blade.php`**

```blade
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'Pullstack') }}</title>
    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
```

Kalau `@routes` (Ziggy) belum ada di project, hapus baris itu — tidak dipakai plan ini, semua link dibangun manual dari path string.

- [ ] **Step 2: Tulis `routes/web.php`**

```php
<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', function () {
    return redirect()->route('dashboard');
})->middleware('auth');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/modules/users.php';
require __DIR__.'/modules/settings.php';
```

- [ ] **Step 3: Tulis stub `DashboardController`**

```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('dashboard');
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add resources/views/app.blade.php routes/web.php app/Http/Controllers/DashboardController.php
git commit -m "feat: wire Inertia React entry point and root redirect"
```

(`routes/auth.php`, `routes/modules/users.php`, `routes/modules/settings.php` dibuat di task selanjutnya — file ini di-`require` sekarang tapi baru diisi nanti; boleh commit dengan file kosong `<?php` dulu supaya `require` tidak error, ditimpa Task 5/8/10.)

- [ ] **Step 5: Buat file route kosong sementara supaya `require` tidak error**

```bash
mkdir -p routes/modules
printf '<?php\n' > routes/auth.php
printf '<?php\n' > routes/modules/users.php
printf '<?php\n' > routes/modules/settings.php
git add routes/auth.php routes/modules/users.php routes/modules/settings.php
git commit -m "chore: add empty route module files"
```

---

### Task 4: Migration `users.role/is_active`, `module_user`, `settings`

**Files:**
- Create: `database/migrations/2026_09_12_000001_add_role_and_is_active_to_users_table.php`
- Create: `database/migrations/2026_09_12_000002_create_module_user_table.php`
- Create: `database/migrations/2026_09_12_000003_create_settings_table.php`
- Modify: `app/Models/User.php`
- Create: `app/Modules/Settings/Models/Setting.php`
- Create: `app/Support/Settings/Settings.php`
- Test: `tests/Feature/Support/SettingsTest.php`

**Interfaces:**
- Produces: `Settings::get(string $code, array $default = []): array` dan `Settings::set(string $code, array $content): void` — dipakai modul Settings (Task 10) dan template PDF invoice di plan Invoice.
- Produces: `User::isAdmin(): bool`, relasi `User::moduleAccess()` — dipakai `EnsureModuleAccess` (Task 6) dan `ModuleRegistry`.

- [ ] **Step 1: Tulis migration `add_role_and_is_active_to_users_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->after('password');
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active']);
        });
    }
};
```

- [ ] **Step 2: Tulis migration `create_module_user_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('module');
            $table->enum('level', ['view', 'manage']);
            $table->timestamps();
            $table->unique(['user_id', 'module']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_user');
    }
};
```

- [ ] **Step 3: Tulis migration `create_settings_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->json('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
```

- [ ] **Step 4: Update `app/Models/User.php`**

```php
<?php

namespace App\Models;

use App\Modules\Users\Models\ModuleUser;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role', 'is_active'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function moduleAccess(): HasMany
    {
        return $this->hasMany(ModuleUser::class);
    }

    public function levelFor(string $module): ?string
    {
        return $this->moduleAccess->firstWhere('module', $module)?->level;
    }
}
```

- [ ] **Step 5: Buat `app/Modules/Users/Models/ModuleUser.php`**

```php
<?php

namespace App\Modules\Users\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleUser extends Model
{
    protected $table = 'module_user';

    protected $fillable = ['user_id', 'module', 'level'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

- [ ] **Step 6: Buat `app/Modules/Settings/Models/Setting.php`**

```php
<?php

namespace App\Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['code', 'content'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }
}
```

- [ ] **Step 7: Tulis test lebih dulu — `tests/Feature/Support/SettingsTest.php`**

```php
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
```

- [ ] **Step 8: Jalankan test, pastikan gagal (class belum ada)**

Run: `php artisan test --filter=SettingsTest`
Expected: FAIL — `Class "App\Support\Settings\Settings" not found`.

- [ ] **Step 9: Implementasi `app/Support/Settings/Settings.php`**

```php
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
```

- [ ] **Step 10: Jalankan migration dan test, pastikan lulus**

Run: `php artisan migrate:fresh && php artisan test --filter=SettingsTest`
Expected: 3 passed.

- [ ] **Step 11: Commit**

```bash
git add database/migrations app/Models/User.php app/Modules/Users/Models/ModuleUser.php app/Modules/Settings/Models/Setting.php app/Support/Settings/Settings.php tests/Feature/Support/SettingsTest.php
git commit -m "feat: add role/access/settings schema and Settings helper"
```

---

### Task 5: Auth — login, logout, guest middleware

**Files:**
- Create: `app/Http/Controllers/Auth/LoginController.php`
- Create: `app/Http/Requests/Auth/LoginRequest.php`
- Modify: `routes/auth.php`
- Create: `resources/js/pages/auth/login.tsx`
- Create: `resources/js/types/index.ts`
- Test: `tests/Feature/Auth/LoginTest.php`

**Interfaces:**
- Consumes: `User::isAdmin()` dari Task 4.
- Produces: route `login` (GET/POST) dan `logout` (POST) — dipakai `AppLayout` (Task 7) untuk tombol logout dan middleware `auth` bawaan Laravel untuk semua route internal.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Auth/LoginTest.php`**

```php
<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_visiting_root_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret123')]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret123'),
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=LoginTest`
Expected: FAIL — route `login` tidak ditemukan.

- [ ] **Step 3: Tulis `app/Http/Requests/Auth/LoginRequest.php`**

```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate(): void
    {
        $credentials = $this->only('email', 'password');

        if (! Auth::attempt($credentials, $this->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => 'Akun ini nonaktif.',
            ]);
        }

        $this->session()->regenerate();
    }
}
```

- [ ] **Step 4: Tulis `app/Http/Controllers/Auth/LoginController.php`**

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
```

- [ ] **Step 5: Tulis `routes/auth.php`**

```php
<?php

use App\Http\Controllers\Auth\LoginController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware('auth')->post('/logout', [LoginController::class, 'destroy'])->name('logout');
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=LoginTest`
Expected: 5 passed.

- [ ] **Step 7: Tulis tipe bersama `resources/js/types/index.ts`**

```ts
export interface ModuleLink {
    key: string;
    label: string;
    href: string;
    icon: string;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'staff';
}

export interface SharedProps {
    auth: {
        user: AuthUser;
        modules: ModuleLink[];
    };
    [key: string]: unknown;
}
```

- [ ] **Step 8: Tulis halaman login `resources/js/pages/auth/login.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/login');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>Pullstack Internal</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={processing}>
                            Masuk
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
```

- [ ] **Step 9: Verifikasi manual**

Run: `npm run build && php artisan serve`
Expected: buka `/`, redirect ke `/login`, form tampil dengan shadcn styling.

- [ ] **Step 10: Commit**

```bash
git add app/Http/Controllers/Auth app/Http/Requests/Auth routes/auth.php resources/js/pages/auth resources/js/types tests/Feature/Auth
git commit -m "feat: add manual login/logout flow"
```

---

### Task 6: ModuleRegistry + middleware akses modul + Gate admin bypass

**Files:**
- Create: `app/Support/Modules/ModuleRegistry.php`
- Create: `app/Http/Middleware/EnsureModuleAccess.php`
- Modify: `bootstrap/app.php` (Laravel 10 pakai `app/Http/Kernel.php` — sesuaikan file yang benar-benar ada di repo)
- Modify: `app/Providers/AuthServiceProvider.php`
- Test: `tests/Feature/Support/ModuleAccessTest.php`

**Interfaces:**
- Consumes: `User::isAdmin()`, `User::levelFor()` dari Task 4.
- Produces: middleware alias `module` dipakai sebagai `module:docs,view` di route group modul Docs/Invoice (plan lain); `ModuleRegistry::all(): array` dan `ModuleRegistry::visibleFor(User $user): array` dipakai `AppLayout` (Task 7) dan `SharedDataMiddleware` kalau ada, atau langsung di `HandleInertiaRequests`.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Support/ModuleAccessTest.php`**

Route dummy dipakai di test ini via `Route::fake` tidak tersedia bawaan, jadi daftarkan route sungguhan sementara di dalam test lewat `Route::middleware(...)->get(...)` pada `setUp()`.

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=ModuleAccessTest`
Expected: FAIL — middleware alias `module` tidak dikenal.

- [ ] **Step 3: Tulis `app/Http/Middleware/EnsureModuleAccess.php`**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    private const LEVEL_RANK = ['view' => 1, 'manage' => 2];

    public function handle(Request $request, Closure $next, string $module, string $level): Response
    {
        $user = $request->user();

        abort_if(! $user, 403);

        if ($user->isAdmin()) {
            return $next($request);
        }

        $userLevel = $user->levelFor($module);

        abort_if($userLevel === null, 403);
        abort_if(self::LEVEL_RANK[$userLevel] < self::LEVEL_RANK[$level], 403);

        return $next($request);
    }
}
```

- [ ] **Step 4: Daftarkan alias middleware**

Cek file yang ada di repo: `php artisan --version` Laravel 10 biasanya masih pakai `app/Http/Kernel.php`. Buka file itu, tambahkan di `$routeMiddleware`:

```php
protected $routeMiddleware = [
    // ...entries bawaan tetap ada...
    'module' => \App\Http\Middleware\EnsureModuleAccess::class,
];
```

- [ ] **Step 5: Tulis `app/Support/Modules/ModuleRegistry.php`**

```php
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
```

- [ ] **Step 6: Tulis `app/Providers/AuthServiceProvider.php`**

```php
<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [];

    public function boot(): void
    {
        Gate::before(function ($user, string $ability) {
            return $user->isAdmin() ? true : null;
        });
    }
}
```

Pastikan provider ini terdaftar di `config/app.php` (`App\Providers\AuthServiceProvider::class`) — biasanya sudah ada bawaan Laravel 10.

- [ ] **Step 7: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=ModuleAccessTest`
Expected: 4 passed.

- [ ] **Step 8: Commit**

```bash
git add app/Support/Modules app/Http/Middleware/EnsureModuleAccess.php app/Http/Kernel.php app/Providers/AuthServiceProvider.php tests/Feature/Support/ModuleAccessTest.php
git commit -m "feat: add module access middleware, registry, and admin gate bypass"
```

---

### Task 7: HandleInertiaRequests shared props + AppLayout sidebar

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Create: `resources/js/layouts/app-layout.tsx`
- Create: `resources/js/components/app/page-header.tsx`
- Modify: `resources/js/pages/dashboard.tsx`

**Interfaces:**
- Consumes: `ModuleRegistry::visibleFor()` (Task 6), tipe `SharedProps` (Task 5).
- Produces: `<AppLayout>` — dipakai semua halaman internal (`dashboard`, `users/*`, `settings/*`, dan modul Docs/Invoice di plan lain) sebagai pembungkus sidebar+topbar.

- [ ] **Step 1: Modifikasi `app/Http/Middleware/HandleInertiaRequests.php`**

```php
<?php

namespace App\Http\Middleware;

use App\Support\Modules\ModuleRegistry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
                'modules' => $user ? ModuleRegistry::visibleFor($user) : [],
            ],
        ];
    }
}
```

- [ ] **Step 2: Tulis `resources/js/components/app/page-header.tsx`**

```tsx
interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b pb-4">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    );
}
```

- [ ] **Step 3: Tulis `resources/js/layouts/app-layout.tsx`**

```tsx
import { PropsWithChildren } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, FileText, Users, Settings, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    users: Users,
    settings: Settings,
};

export function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 shrink-0 border-r bg-muted/30 p-4">
                <div className="mb-6 px-2 text-lg font-bold">Pullstack</div>
                <nav className="space-y-1">
                    {auth.modules.map((module) => {
                        const Icon = ICONS[module.icon] ?? FileText;

                        return (
                            <Link
                                key={module.key}
                                href={module.href}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                            >
                                <Icon className="h-4 w-4" />
                                {module.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b px-6 py-3">
                    <span className="text-sm text-muted-foreground">{auth.user.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => router.post('/logout')}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Keluar
                    </Button>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Pakai layout di `resources/js/pages/dashboard.tsx`**

```tsx
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';

export default function Dashboard() {
    return (
        <AppLayout>
            <PageHeader title="Dashboard" />
        </AppLayout>
    );
}
```

- [ ] **Step 5: Verifikasi manual**

Run: `npm run build`, login sebagai user dummy (buat via tinker: `php artisan tinker` → `User::factory()->create(['role' => 'admin', 'email' => 'admin@test.com', 'password' => bcrypt('password')])`).
Expected: setelah login, sidebar tampil dengan menu Docs/Invoice/Users/Settings (karena admin), klik Keluar berhasil logout.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php resources/js/layouts resources/js/components/app resources/js/pages/dashboard.tsx
git commit -m "feat: add shared module props and app shell layout"
```

---

### Task 8: Modul Users — backend CRUD

**Files:**
- Create: `app/Modules/Users/Http/Controllers/UserController.php`
- Create: `app/Modules/Users/Http/Requests/StoreUserRequest.php`
- Create: `app/Modules/Users/Http/Requests/UpdateUserRequest.php`
- Create: `app/Modules/Users/Policies/UserPolicy.php`
- Modify: `routes/modules/users.php`
- Modify: `app/Providers/AuthServiceProvider.php`
- Test: `tests/Feature/Users/UserManagementTest.php`

**Interfaces:**
- Consumes: `ModuleUser` model (Task 4).
- Produces: route `users.index/store/update/destroy` — dipakai frontend Task 9.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Users/UserManagementTest.php`**

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=UserManagementTest`
Expected: FAIL — route `/users` belum ada.

- [ ] **Step 3: Tulis `app/Modules/Users/Policies/UserPolicy.php`**

```php
<?php

namespace App\Modules\Users\Policies;

use App\Models\User;

class UserPolicy
{
    public function manage(User $user): bool
    {
        return $user->isAdmin();
    }
}
```

Karena `Gate::before` (Task 6) sudah meloloskan admin, policy ini efektif menolak semua non-admin — cukup dipanggil `$this->authorize('manage', User::class)` di controller.

- [ ] **Step 4: Daftarkan policy di `AuthServiceProvider`**

```php
protected $policies = [
    User::class => \App\Modules\Users\Policies\UserPolicy::class,
];
```

- [ ] **Step 5: Tulis `StoreUserRequest` dan `UpdateUserRequest`**

```php
<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,staff'],
            'module_access' => ['array'],
            'module_access.*.module' => ['required_with:module_access', 'in:docs,invoice'],
            'module_access.*.level' => ['required_with:module_access', 'in:view,manage'],
        ];
    }
}
```

```php
<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:admin,staff'],
            'is_active' => ['required', 'boolean'],
            'module_access' => ['array'],
            'module_access.*.module' => ['required_with:module_access', 'in:docs,invoice'],
            'module_access.*.level' => ['required_with:module_access', 'in:view,manage'],
        ];
    }
}
```

- [ ] **Step 6: Tulis `app/Modules/Users/Http/Controllers/UserController.php`**

```php
<?php

namespace App\Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Users\Http\Requests\StoreUserRequest;
use App\Modules\Users\Http\Requests\UpdateUserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/index', [
            'users' => User::with('moduleAccess')->orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user = User::create([
            ...$request->safe()->only('name', 'email', 'role'),
            'password' => Hash::make($request->validated('password')),
        ]);

        $user->moduleAccess()->createMany($request->validated('module_access', []));

        return redirect()->route('users.index');
    }

    public function edit(User $user): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('users/edit', [
            'user' => $user->load('moduleAccess'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user->update([
            ...$request->safe()->only('name', 'email', 'role', 'is_active'),
            ...($request->validated('password') ? ['password' => Hash::make($request->validated('password'))] : []),
        ]);

        $user->moduleAccess()->delete();
        $user->moduleAccess()->createMany($request->validated('module_access', []));

        return redirect()->route('users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $user->update(['is_active' => false]);

        return redirect()->route('users.index');
    }
}
```

- [ ] **Step 7: Tulis `routes/modules/users.php`**

```php
<?php

use App\Modules\Users\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('users', UserController::class)->except(['show']);
});
```

- [ ] **Step 8: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=UserManagementTest`
Expected: 4 passed.

- [ ] **Step 9: Commit**

```bash
git add app/Modules/Users routes/modules/users.php app/Providers/AuthServiceProvider.php tests/Feature/Users
git commit -m "feat: add user management CRUD with module access assignment"
```

---

### Task 9: Modul Users — frontend

**Files:**
- Create: `resources/js/pages/users/index.tsx`
- Create: `resources/js/pages/users/create.tsx`
- Create: `resources/js/pages/users/edit.tsx`
- Create: `resources/js/components/app/module-access-fields.tsx`

**Interfaces:**
- Consumes: route `users.*` (Task 8), komponen shadcn (Task 2).

- [ ] **Step 1: Tulis `resources/js/components/app/module-access-fields.tsx`**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ModuleAccessEntry {
    module: 'docs' | 'invoice';
    level: 'view' | 'manage';
}

const MODULES: Array<{ key: ModuleAccessEntry['module']; label: string }> = [
    { key: 'docs', label: 'Dokumentasi' },
    { key: 'invoice', label: 'Invoice' },
];

interface Props {
    value: ModuleAccessEntry[];
    onChange: (value: ModuleAccessEntry[]) => void;
}

export function ModuleAccessFields({ value, onChange }: Props) {
    function toggle(moduleKey: ModuleAccessEntry['module'], checked: boolean) {
        if (checked) {
            onChange([...value, { module: moduleKey, level: 'view' }]);
        } else {
            onChange(value.filter((entry) => entry.module !== moduleKey));
        }
    }

    function setLevel(moduleKey: ModuleAccessEntry['module'], level: ModuleAccessEntry['level']) {
        onChange(value.map((entry) => (entry.module === moduleKey ? { ...entry, level } : entry)));
    }

    return (
        <div className="space-y-3">
            <Label>Akses Modul</Label>
            {MODULES.map(({ key, label }) => {
                const entry = value.find((e) => e.module === key);

                return (
                    <div key={key} className="flex items-center gap-3">
                        <Checkbox
                            checked={!!entry}
                            onCheckedChange={(checked) => toggle(key, checked === true)}
                        />
                        <span className="w-32 text-sm">{label}</span>
                        {entry && (
                            <Select value={entry.level} onValueChange={(v) => setLevel(key, v as ModuleAccessEntry['level'])}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">View</SelectItem>
                                    <SelectItem value="manage">Manage</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
```

- [ ] **Step 2: Tulis `resources/js/pages/users/index.tsx`**

```tsx
import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    is_active: boolean;
}

export default function UsersIndex({ users }: { users: UserRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Users"
                action={
                    <Button asChild>
                        <Link href="/users/create">Tambah User</Link>
                    </Button>
                }
            />
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>
                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/users/${user.id}/edit`}>Edit</Link>
                                </Button>
                                {user.is_active && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => router.delete(`/users/${user.id}`)}
                                    >
                                        Nonaktifkan
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Tulis `resources/js/pages/users/create.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleAccessFields, ModuleAccessEntry } from '@/components/app/module-access-fields';

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        role: 'admin' | 'staff';
        module_access: ModuleAccessEntry[];
    }>({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        module_access: [],
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/users');
    }

    return (
        <AppLayout>
            <PageHeader title="Tambah User" />
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={data.role} onValueChange={(v) => setData('role', v as 'admin' | 'staff')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {data.role === 'staff' && (
                    <ModuleAccessFields value={data.module_access} onChange={(v) => setData('module_access', v)} />
                )}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 4: Tulis `resources/js/pages/users/edit.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleAccessFields, ModuleAccessEntry } from '@/components/app/module-access-fields';

interface EditUserProps {
    user: {
        id: number;
        name: string;
        email: string;
        role: 'admin' | 'staff';
        is_active: boolean;
        module_access: ModuleAccessEntry[];
    };
}

export default function EditUser({ user }: EditUserProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active,
        module_access: user.module_access.map(({ module, level }) => ({ module, level })),
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/users/${user.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit ${user.name}`} />
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password baru (opsional)</Label>
                    <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={data.role} onValueChange={(v) => setData('role', v as 'admin' | 'staff')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {data.role === 'staff' && (
                    <ModuleAccessFields value={data.module_access} onChange={(v) => setData('module_access', v)} />
                )}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 5: Verifikasi manual**

Run: `npm run build`, login sebagai admin, buka `/users`, buat user staff baru dengan akses `docs:view`, edit, nonaktifkan.
Expected: semua alur jalan tanpa error console.

- [ ] **Step 6: Commit**

```bash
git add resources/js/pages/users resources/js/components/app/module-access-fields.tsx
git commit -m "feat: add user management UI"
```

---

### Task 10: Modul Settings — backend

**Files:**
- Create: `app/Modules/Settings/Http/Controllers/SettingController.php`
- Create: `app/Modules/Settings/Http/Requests/UpdateSettingRequest.php`
- Modify: `routes/modules/settings.php`
- Test: `tests/Feature/Settings/SettingManagementTest.php`

**Interfaces:**
- Consumes: `Settings` helper (Task 4).
- Produces: route `settings.index`, `settings.update` — dipakai frontend Task 11 dan template PDF invoice di plan Invoice.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Settings/SettingManagementTest.php`**

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=SettingManagementTest`
Expected: FAIL — route `/settings` belum ada.

- [ ] **Step 3: Tulis `UpdateSettingRequest`**

```php
<?php

namespace App\Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'array'],
        ];
    }
}
```

- [ ] **Step 4: Tulis `SettingController`**

```php
<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Settings\Http\Requests\UpdateSettingRequest;
use App\Support\Settings\Settings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(private readonly Settings $settings) {}

    public function index(): Response
    {
        $this->authorize('manage', User::class);

        return Inertia::render('settings/index', [
            'issuer' => $this->settings->get('invoice.issuer', [
                'name' => '', 'address' => '', 'phone' => '', 'email' => '',
            ]),
            'payment' => $this->settings->get('invoice.payment', [
                'account_name' => '', 'bank' => '', 'account_number' => '',
            ]),
        ]);
    }

    public function update(UpdateSettingRequest $request, string $code): RedirectResponse
    {
        $this->authorize('manage', User::class);

        $this->settings->set($code, $request->validated('content'));

        return redirect()->route('settings.index');
    }
}
```

Menggunakan policy `UserPolicy@manage` yang sama (admin-only) supaya tidak menambah kelas baru untuk aturan yang identik.

- [ ] **Step 5: Tulis `routes/modules/settings.php`**

```php
<?php

use App\Modules\Settings\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::put('/settings/{code}', [SettingController::class, 'update'])->name('settings.update')
        ->where('code', 'invoice\.issuer|invoice\.payment');
});
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=SettingManagementTest`
Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Settings/Http/Controllers app/Modules/Settings/Http/Requests routes/modules/settings.php tests/Feature/Settings
git commit -m "feat: add settings management for invoice issuer and payment info"
```

---

### Task 11: Modul Settings — frontend

**Files:**
- Create: `resources/js/pages/settings/index.tsx`

**Interfaces:**
- Consumes: route `settings.update` (Task 10).

- [ ] **Step 1: Tulis `resources/js/pages/settings/index.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Issuer {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface Payment {
    account_name: string;
    bank: string;
    account_number: string;
}

export default function SettingsIndex({ issuer, payment }: { issuer: Issuer; payment: Payment }) {
    const issuerForm = useForm({ content: issuer });
    const paymentForm = useForm({ content: payment });

    function submitIssuer(e: FormEvent) {
        e.preventDefault();
        issuerForm.put('/settings/invoice.issuer');
    }

    function submitPayment(e: FormEvent) {
        e.preventDefault();
        paymentForm.put('/settings/invoice.payment');
    }

    return (
        <AppLayout>
            <PageHeader title="Settings" description="Data penerbit dan pembayaran untuk invoice" />
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Data Penerbit</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submitIssuer} className="space-y-3">
                            <div className="space-y-1">
                                <Label>Nama</Label>
                                <Input
                                    value={issuerForm.data.content.name}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Alamat</Label>
                                <Input
                                    value={issuerForm.data.content.address}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>No. Telepon</Label>
                                <Input
                                    value={issuerForm.data.content.phone}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Email</Label>
                                <Input
                                    value={issuerForm.data.content.email}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, email: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={issuerForm.processing}>Simpan</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submitPayment} className="space-y-3">
                            <div className="space-y-1">
                                <Label>Nama Pemilik Rekening</Label>
                                <Input
                                    value={paymentForm.data.content.account_name}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, account_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Bank</Label>
                                <Input
                                    value={paymentForm.data.content.bank}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, bank: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Nomor Rekening</Label>
                                <Input
                                    value={paymentForm.data.content.account_number}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, account_number: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={paymentForm.processing}>Simpan</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Verifikasi manual**

Run: `npm run build`, login admin, buka `/settings`, isi form, simpan, refresh, pastikan data tersimpan tampil kembali.

- [ ] **Step 3: Commit**

```bash
git add resources/js/pages/settings
git commit -m "feat: add settings UI for invoice issuer and payment info"
```

---

### Task 12: Seeder admin awal

**Files:**
- Create: `database/seeders/AdminUserSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Tidak dikonsumsi task lain — titik masuk manual untuk operator pertama.

- [ ] **Step 1: Tulis `database/seeders/AdminUserSeeder.php`**

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@pullstack.cloud'],
            [
                'name' => 'Admin',
                'password' => Hash::make('ubah-password-ini'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );
    }
}
```

- [ ] **Step 2: Panggil dari `DatabaseSeeder`**

```php
public function run(): void
{
    $this->call(AdminUserSeeder::class);
}
```

- [ ] **Step 3: Verifikasi**

Run: `php artisan migrate:fresh --seed && php artisan test`
Expected: semua test dari Task 4-11 lulus, dan `php artisan tinker` → `User::where('role','admin')->exists()` bernilai `true`.

- [ ] **Step 4: Commit**

```bash
git add database/seeders
git commit -m "feat: seed initial admin account"
```

---

## Self-Review

**Spec coverage:** §3 (stack, auth tanpa Breeze) → Task 1, 5. §4 (struktur modul) → Task 4, 6, 8, 10. §5 (auth & hak akses, matriks) → Task 4, 5, 6, 8. Settings sebagai fondasi §6 → Task 4, 10, 11. Fase 0 §8 seluruhnya tercakup Task 1-12.

**Placeholder scan:** tidak ada TBD/TODO; semua step berisi kode konkret.

**Type consistency:** `ModuleLink`/`AuthUser`/`SharedProps` (Task 5) dipakai identik di `AppLayout` (Task 7). `ModuleAccessEntry` didefinisikan Task 9, dipakai konsisten di `create.tsx` dan `edit.tsx`. `Settings::get/set` (Task 4) dipanggil dengan signature sama persis di `SettingController` (Task 10).
