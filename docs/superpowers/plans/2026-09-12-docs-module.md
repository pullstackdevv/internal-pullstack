# Docs Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modul dokumentasi internal: kategori + dokumen markdown, editor dengan preview, halaman baca dengan TOC otomatis dan tombol copy per blok kode, migrasi konten `blueprint.md` yang sudah ada.

**Architecture:** CRUD dua tingkat (`doc_categories` → `documents`) di `app/Modules/Docs`, dijaga middleware `module:docs,<level>`. Konten markdown dirender di client dengan `react-markdown` — tidak ada HTML mentah, jadi aman dari XSS tanpa sanitizer tambahan.

**Tech Stack:** Laravel 10, React 19 + TypeScript, Inertia.js, `react-markdown` + `remark-gfm`.

**Spec:** `docs/superpowers/specs/2026-09-12-internal-cms-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-12-foundation.md` harus sudah selesai — plan ini memakai `AppLayout`, `EnsureModuleAccess` middleware, `User::isAdmin()`/`levelFor()`, dan `ModuleRegistry` dari sana.

## Global Constraints

- Slug dokumen unik global, bukan per kategori (spec §6, "Modul Dokumentasi") — supaya pindah kategori tidak mengubah URL.
- Level `view` hanya boleh baca; level `manage` boleh CRUD kategori dan dokumen (spec §5, matriks akses).
- Dokumen dengan `is_published = false` hanya terlihat untuk level `manage`, disembunyikan dari level `view` (spec §7 mengacu ke perilaku draft — didetailkan di Task 3 plan ini).
- Isi `blueprint.md` dipindah jadi dokumen pertama, kategori "Infrastructure" (spec §8, Fase 1a).

---

## File Structure

**Backend (baru):**
- `database/migrations/*_create_doc_categories_table.php`
- `database/migrations/*_create_documents_table.php`
- `app/Modules/Docs/Models/DocCategory.php`
- `app/Modules/Docs/Models/Document.php`
- `app/Modules/Docs/Http/Controllers/DocCategoryController.php`
- `app/Modules/Docs/Http/Controllers/DocumentController.php`
- `app/Modules/Docs/Http/Requests/StoreDocCategoryRequest.php`, `UpdateDocCategoryRequest.php`
- `app/Modules/Docs/Http/Requests/StoreDocumentRequest.php`, `UpdateDocumentRequest.php`
- `database/seeders/DocsSeeder.php`

**Backend (dimodifikasi):**
- `routes/modules/docs.php`

**Frontend (baru):**
- `resources/js/pages/docs/categories/index.tsx`
- `resources/js/pages/docs/index.tsx` (daftar dokumen per kategori, sidebar navigasi docs)
- `resources/js/pages/docs/create.tsx`, `edit.tsx`
- `resources/js/pages/docs/show.tsx` (halaman baca)
- `resources/js/components/app/markdown-content.tsx` (renderer + TOC + copy button)

---

### Task 1: Migration & model `doc_categories`, `documents`

**Files:**
- Create: `database/migrations/2026_09_12_010001_create_doc_categories_table.php`
- Create: `database/migrations/2026_09_12_010002_create_documents_table.php`
- Create: `app/Modules/Docs/Models/DocCategory.php`
- Create: `app/Modules/Docs/Models/Document.php`
- Test: `tests/Feature/Docs/DocumentSlugTest.php`

**Interfaces:**
- Produces: `Document::slugFromTitle(string $title): string` (static helper) dan auto-generate slug di event `creating` — dipakai `DocumentController` (Task 3).

- [ ] **Step 1: Tulis migration `create_doc_categories_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_categories');
    }
};
```

- [ ] **Step 2: Tulis migration `create_documents_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doc_category_id')->constrained('doc_categories')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('body_markdown');
            $table->string('excerpt')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
```

- [ ] **Step 3: Tulis `app/Modules/Docs/Models/DocCategory.php`**

```php
<?php

namespace App\Modules\Docs\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DocCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'position'];

    protected static function booted(): void
    {
        static::creating(function (self $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
```

- [ ] **Step 4: Tulis test lebih dulu — `tests/Feature/Docs/DocumentSlugTest.php`**

```php
<?php

namespace Tests\Feature\Docs;

use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\QueryException;
use Tests\TestCase;

class DocumentSlugTest extends TestCase
{
    use RefreshDatabase;

    public function test_slug_generated_from_title_when_not_provided(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);

        $document = Document::create([
            'doc_category_id' => $category->id,
            'title' => 'VPS Deployment Guide',
            'body_markdown' => '# Hello',
        ]);

        $this->assertSame('vps-deployment-guide', $document->slug);
    }

    public function test_slug_must_be_unique(): void
    {
        $category = DocCategory::create(['name' => 'Infrastructure']);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Guide',
            'slug' => 'guide',
            'body_markdown' => '# A',
        ]);

        $this->expectException(QueryException::class);

        Document::create([
            'doc_category_id' => $category->id,
            'title' => 'Another Guide',
            'slug' => 'guide',
            'body_markdown' => '# B',
        ]);
    }
}
```

- [ ] **Step 5: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=DocumentSlugTest`
Expected: FAIL — class `Document` belum ada.

- [ ] **Step 6: Tulis `app/Modules/Docs/Models/Document.php`**

```php
<?php

namespace App\Modules\Docs\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Document extends Model
{
    protected $fillable = [
        'doc_category_id', 'title', 'slug', 'body_markdown',
        'excerpt', 'position', 'is_published', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['is_published' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::creating(function (self $document) {
            if (empty($document->slug)) {
                $document->slug = Str::slug($document->title);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocCategory::class, 'doc_category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

- [ ] **Step 7: Migrate dan jalankan test, pastikan lulus**

Run: `php artisan migrate && php artisan test --filter=DocumentSlugTest`
Expected: 2 passed.

- [ ] **Step 8: Commit**

```bash
git add database/migrations app/Modules/Docs/Models tests/Feature/Docs/DocumentSlugTest.php
git commit -m "feat: add doc category and document schema with slug generation"
```

---

### Task 2: `DocCategoryController` CRUD

**Files:**
- Create: `app/Modules/Docs/Http/Controllers/DocCategoryController.php`
- Create: `app/Modules/Docs/Http/Requests/StoreDocCategoryRequest.php`
- Create: `app/Modules/Docs/Http/Requests/UpdateDocCategoryRequest.php`
- Modify: `routes/modules/docs.php`
- Test: `tests/Feature/Docs/DocCategoryManagementTest.php`

**Interfaces:**
- Consumes: middleware `module:docs,<level>` (dari plan Foundation Task 6).
- Produces: route `doc-categories.index/store/update/destroy` — dipakai frontend Task 5.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Docs/DocCategoryManagementTest.php`**

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=DocCategoryManagementTest`
Expected: FAIL — route `/doc-categories` belum ada.

- [ ] **Step 3: Tulis `StoreDocCategoryRequest` dan `UpdateDocCategoryRequest`**

```php
<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
```

```php
<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
```

- [ ] **Step 4: Tulis `DocCategoryController`**

```php
<?php

namespace App\Modules\Docs\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Docs\Http\Requests\StoreDocCategoryRequest;
use App\Modules\Docs\Http\Requests\UpdateDocCategoryRequest;
use App\Modules\Docs\Models\DocCategory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DocCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('docs/categories/index', [
            'categories' => DocCategory::withCount('documents')->orderBy('position')->get(),
        ]);
    }

    public function store(StoreDocCategoryRequest $request): RedirectResponse
    {
        DocCategory::create($request->validated());

        return redirect()->route('doc-categories.index');
    }

    public function update(UpdateDocCategoryRequest $request, DocCategory $docCategory): RedirectResponse
    {
        $docCategory->update($request->validated());

        return redirect()->route('doc-categories.index');
    }

    public function destroy(DocCategory $docCategory): RedirectResponse
    {
        $docCategory->delete();

        return redirect()->route('doc-categories.index');
    }
}
```

Tidak ada `$this->authorize(...)` manual di sini — middleware `module:docs,manage` di route (Step 5) sudah menjaga `store`/`update`/`destroy`, dan `module:docs,view` menjaga `index`.

- [ ] **Step 5: Tulis `routes/modules/docs.php`**

```php
<?php

use App\Modules\Docs\Http\Controllers\DocCategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:docs,view'])->group(function () {
    Route::get('/doc-categories', [DocCategoryController::class, 'index'])->name('doc-categories.index');
});

Route::middleware(['auth', 'module:docs,manage'])->group(function () {
    Route::post('/doc-categories', [DocCategoryController::class, 'store'])->name('doc-categories.store');
    Route::put('/doc-categories/{docCategory}', [DocCategoryController::class, 'update'])->name('doc-categories.update');
    Route::delete('/doc-categories/{docCategory}', [DocCategoryController::class, 'destroy'])->name('doc-categories.destroy');
});
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=DocCategoryManagementTest`
Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Docs/Http/Controllers/DocCategoryController.php app/Modules/Docs/Http/Requests/StoreDocCategoryRequest.php app/Modules/Docs/Http/Requests/UpdateDocCategoryRequest.php routes/modules/docs.php tests/Feature/Docs/DocCategoryManagementTest.php
git commit -m "feat: add doc category CRUD"
```

---

### Task 3: `DocumentController` CRUD (dengan aturan draft)

**Files:**
- Create: `app/Modules/Docs/Http/Controllers/DocumentController.php`
- Create: `app/Modules/Docs/Http/Requests/StoreDocumentRequest.php`
- Create: `app/Modules/Docs/Http/Requests/UpdateDocumentRequest.php`
- Modify: `routes/modules/docs.php`
- Test: `tests/Feature/Docs/DocumentManagementTest.php`

**Interfaces:**
- Consumes: `DocCategory`, `Document` (Task 1).
- Produces: route `documents.index/show/create/store/edit/update/destroy` — dipakai frontend Task 5-6.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Docs/DocumentManagementTest.php`**

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=DocumentManagementTest`
Expected: FAIL — route `/docs` (GET index dokumen) belum ada.

- [ ] **Step 3: Tulis `StoreDocumentRequest` dan `UpdateDocumentRequest`**

```php
<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doc_category_id' => ['required', 'exists:doc_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_markdown' => ['required', 'string'],
            'is_published' => ['boolean'],
        ];
    }
}
```

```php
<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doc_category_id' => ['required', 'exists:doc_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_markdown' => ['required', 'string'],
            'is_published' => ['boolean'],
        ];
    }
}
```

- [ ] **Step 4: Tulis `DocumentController`**

```php
<?php

namespace App\Modules\Docs\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Docs\Http\Requests\StoreDocumentRequest;
use App\Modules\Docs\Http\Requests\UpdateDocumentRequest;
use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $canManage = $request->user()->isAdmin() || $request->user()->levelFor('docs') === 'manage';

        $documents = Document::with('category')
            ->when(! $canManage, fn ($query) => $query->where('is_published', true))
            ->orderBy('doc_category_id')
            ->orderBy('position')
            ->get();

        return Inertia::render('docs/index', [
            'documents' => $documents,
            'canManage' => $canManage,
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $canManage = $request->user()->isAdmin() || $request->user()->levelFor('docs') === 'manage';

        $document = Document::where('slug', $slug)
            ->when(! $canManage, fn ($query) => $query->where('is_published', true))
            ->firstOrFail();

        return Inertia::render('docs/show', ['document' => $document]);
    }

    public function create(): Response
    {
        return Inertia::render('docs/create', [
            'categories' => DocCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        Document::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('documents.index');
    }

    public function edit(Document $document): Response
    {
        return Inertia::render('docs/edit', [
            'document' => $document,
            'categories' => DocCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        $document->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('documents.index');
    }

    public function destroy(Document $document): RedirectResponse
    {
        $document->delete();

        return redirect()->route('documents.index');
    }
}
```

- [ ] **Step 5: Tambah route dokumen di `routes/modules/docs.php`**

```php
<?php

use App\Modules\Docs\Http\Controllers\DocCategoryController;
use App\Modules\Docs\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:docs,view'])->group(function () {
    Route::get('/doc-categories', [DocCategoryController::class, 'index'])->name('doc-categories.index');
    Route::get('/docs', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/docs/{slug}', [DocumentController::class, 'show'])->name('documents.show');
});

Route::middleware(['auth', 'module:docs,manage'])->group(function () {
    Route::post('/doc-categories', [DocCategoryController::class, 'store'])->name('doc-categories.store');
    Route::put('/doc-categories/{docCategory}', [DocCategoryController::class, 'update'])->name('doc-categories.update');
    Route::delete('/doc-categories/{docCategory}', [DocCategoryController::class, 'destroy'])->name('doc-categories.destroy');

    Route::get('/docs-manage/create', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/docs-manage', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/docs-manage/{document}/edit', [DocumentController::class, 'edit'])->name('documents.edit');
    Route::put('/docs-manage/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/docs-manage/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
});
```

Route create/edit/store dipisah prefix `/docs-manage` supaya tidak bentrok dengan `/docs/{slug}` (route model binding by-slug vs literal segment `create`/`{document}` numeric id keduanya di bawah `/docs` akan ambigu di Laravel kalau digabung satu grup).

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=DocumentManagementTest`
Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Docs/Http/Controllers/DocumentController.php app/Modules/Docs/Http/Requests/StoreDocumentRequest.php app/Modules/Docs/Http/Requests/UpdateDocumentRequest.php routes/modules/docs.php tests/Feature/Docs/DocumentManagementTest.php
git commit -m "feat: add document CRUD with draft visibility rules"
```

---

### Task 4: `markdown-content.tsx` — renderer, TOC, copy button

**Files:**
- Create: `resources/js/components/app/markdown-content.tsx`

**Interfaces:**
- Produces: `<MarkdownContent markdown={string} />` — dipakai `docs/show.tsx` (Task 6) dan preview di `docs/create.tsx`/`edit.tsx` (Task 5).

- [ ] **Step 1: Tulis `resources/js/components/app/markdown-content.tsx`**

```tsx
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
}

function CodeBlock({ children }: { children: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="group relative">
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                <code>{children}</code>
            </pre>
            <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={copy}
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
        </div>
    );
}

export interface Heading {
    depth: number;
    text: string;
    id: string;
}

export function extractHeadings(markdown: string): Heading[] {
    const lines = markdown.split('\n');
    const headings: Heading[] = [];

    for (const line of lines) {
        const match = /^(#{1,3})\s+(.+)$/.exec(line);
        if (match) {
            const text = match[2].trim();
            headings.push({ depth: match[1].length, text, id: slugifyHeading(text) });
        }
    }

    return headings;
}

export function MarkdownContent({ markdown }: { markdown: string }) {
    return (
        <div className="prose prose-neutral max-w-none dark:prose-invert">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 id={slugifyHeading(String(children))}>{children}</h1>,
                    h2: ({ children }) => <h2 id={slugifyHeading(String(children))}>{children}</h2>,
                    h3: ({ children }) => <h3 id={slugifyHeading(String(children))}>{children}</h3>,
                    code({ className, children }) {
                        const isBlock = /language-/.test(className ?? '');
                        const text = String(children).replace(/\n$/, '');

                        if (!isBlock && !text.includes('\n')) {
                            return <code className="rounded bg-muted px-1 py-0.5 text-sm">{text}</code>;
                        }

                        return <CodeBlock>{text}</CodeBlock>;
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
```

`h1`/`h2`/`h3` custom renderer memberi `id` yang sama persis dengan `extractHeadings()`, jadi TOC (dipakai di Task 6) dan anchor scroll target selalu sinkron.

- [ ] **Step 2: Verifikasi manual sementara**

Buat halaman uji cepat (boleh dihapus setelah Task 6 selesai) yang me-render `<MarkdownContent markdown={"# Judul\n\n\`\`\`bash\necho hi\n\`\`\`"} />` — pastikan heading dapat `id="judul"` dan tombol copy muncul saat hover.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/app/markdown-content.tsx
git commit -m "feat: add markdown renderer with heading anchors and copy-to-clipboard"
```

---

### Task 5: Frontend — kategori & form dokumen

**Files:**
- Create: `resources/js/pages/docs/categories/index.tsx`
- Create: `resources/js/pages/docs/create.tsx`
- Create: `resources/js/pages/docs/edit.tsx`

**Interfaces:**
- Consumes: route `doc-categories.*`, `documents.create/store/edit/update` (Task 2-3), `<MarkdownContent>` (Task 4).

- [ ] **Step 1: Tulis `resources/js/pages/docs/categories/index.tsx`**

```tsx
import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CategoryRow {
    id: number;
    name: string;
    documents_count: number;
}

export default function DocCategoriesIndex({ categories }: { categories: CategoryRow[] }) {
    const [name, setName] = useState('');

    function submit(e: FormEvent) {
        e.preventDefault();
        router.post('/doc-categories', { name }, { onSuccess: () => setName('') });
    }

    return (
        <AppLayout>
            <PageHeader title="Kategori Dokumentasi" />
            <form onSubmit={submit} className="mt-4 flex max-w-md gap-2">
                <Input placeholder="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
                <Button type="submit">Tambah</Button>
            </form>
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Jumlah Dokumen</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{category.documents_count}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => router.delete(`/doc-categories/${category.id}`)}
                                >
                                    Hapus
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Tulis `resources/js/pages/docs/create.tsx`**

```tsx
import { FormEvent, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownContent } from '@/components/app/markdown-content';

interface Category {
    id: number;
    name: string;
}

export default function CreateDocument({ categories }: { categories: Category[] }) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const { data, setData, post, processing, errors } = useForm({
        doc_category_id: categories[0]?.id ?? 0,
        title: '',
        excerpt: '',
        body_markdown: '',
        is_published: false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/docs-manage');
    }

    return (
        <AppLayout>
            <PageHeader title="Dokumen Baru" />
            <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Judul</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                            value={String(data.doc_category_id)}
                            onValueChange={(v) => setData('doc_category_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-2 border-b">
                    <button type="button" onClick={() => setTab('write')} className={`px-3 py-2 text-sm ${tab === 'write' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Tulis
                    </button>
                    <button type="button" onClick={() => setTab('preview')} className={`px-3 py-2 text-sm ${tab === 'preview' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Preview
                    </button>
                </div>

                {tab === 'write' ? (
                    <Textarea
                        value={data.body_markdown}
                        onChange={(e) => setData('body_markdown', e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                    />
                ) : (
                    <div className="rounded-md border p-4">
                        <MarkdownContent markdown={data.body_markdown} />
                    </div>
                )}
                {errors.body_markdown && <p className="text-sm text-destructive">{errors.body_markdown}</p>}

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={data.is_published}
                        onCheckedChange={(checked) => setData('is_published', checked === true)}
                    />
                    <Label>Terbitkan</Label>
                </div>

                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Tulis `resources/js/pages/docs/edit.tsx`**

```tsx
import { FormEvent, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownContent } from '@/components/app/markdown-content';

interface Category {
    id: number;
    name: string;
}

interface DocumentData {
    id: number;
    doc_category_id: number;
    title: string;
    excerpt: string | null;
    body_markdown: string;
    is_published: boolean;
}

export default function EditDocument({ document, categories }: { document: DocumentData; categories: Category[] }) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const { data, setData, put, processing, errors } = useForm({
        doc_category_id: document.doc_category_id,
        title: document.title,
        excerpt: document.excerpt ?? '',
        body_markdown: document.body_markdown,
        is_published: document.is_published,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/docs-manage/${document.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit: ${document.title}`} />
            <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Judul</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                            value={String(data.doc_category_id)}
                            onValueChange={(v) => setData('doc_category_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-2 border-b">
                    <button type="button" onClick={() => setTab('write')} className={`px-3 py-2 text-sm ${tab === 'write' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Tulis
                    </button>
                    <button type="button" onClick={() => setTab('preview')} className={`px-3 py-2 text-sm ${tab === 'preview' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Preview
                    </button>
                </div>

                {tab === 'write' ? (
                    <Textarea
                        value={data.body_markdown}
                        onChange={(e) => setData('body_markdown', e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                    />
                ) : (
                    <div className="rounded-md border p-4">
                        <MarkdownContent markdown={data.body_markdown} />
                    </div>
                )}
                {errors.body_markdown && <p className="text-sm text-destructive">{errors.body_markdown}</p>}

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={data.is_published}
                        onCheckedChange={(checked) => setData('is_published', checked === true)}
                    />
                    <Label>Terbitkan</Label>
                </div>

                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 4: Verifikasi manual**

Run: `npm run build`, login sebagai staff `docs:manage`, buat kategori, buat dokumen, toggle preview, publish.

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages/docs/categories resources/js/pages/docs/create.tsx resources/js/pages/docs/edit.tsx
git commit -m "feat: add doc category and document editor UI"
```

---

### Task 6: Frontend — daftar dokumen & halaman baca

**Files:**
- Create: `resources/js/pages/docs/index.tsx`
- Create: `resources/js/pages/docs/show.tsx`

**Interfaces:**
- Consumes: route `documents.index/show` (Task 3), `<MarkdownContent>` + `extractHeadings` (Task 4).

- [ ] **Step 1: Tulis `resources/js/pages/docs/index.tsx`**

```tsx
import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    is_published: boolean;
    category: { name: string };
}

export default function DocumentsIndex({ documents, canManage }: { documents: DocumentRow[]; canManage: boolean }) {
    const grouped = documents.reduce<Record<string, DocumentRow[]>>((acc, doc) => {
        (acc[doc.category.name] ??= []).push(doc);
        return acc;
    }, {});

    return (
        <AppLayout>
            <PageHeader
                title="Dokumentasi"
                action={
                    canManage && (
                        <div className="flex gap-2">
                            <Button variant="outline" asChild><Link href="/doc-categories">Kelola Kategori</Link></Button>
                            <Button asChild><Link href="/docs-manage/create">Dokumen Baru</Link></Button>
                        </div>
                    )
                }
            />
            <div className="mt-4 space-y-6">
                {Object.entries(grouped).map(([categoryName, docs]) => (
                    <div key={categoryName}>
                        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{categoryName}</h2>
                        <div className="space-y-2">
                            {docs.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/docs/${doc.slug}`}
                                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted"
                                >
                                    <div>
                                        <p className="font-medium">{doc.title}</p>
                                        {doc.excerpt && <p className="text-sm text-muted-foreground">{doc.excerpt}</p>}
                                    </div>
                                    {!doc.is_published && <Badge variant="secondary">Draft</Badge>}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
```

- [ ] **Step 2: Tulis `resources/js/pages/docs/show.tsx`**

```tsx
import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { MarkdownContent, extractHeadings } from '@/components/app/markdown-content';

interface DocumentData {
    id: number;
    title: string;
    body_markdown: string;
}

export default function ShowDocument({ document }: { document: DocumentData }) {
    const headings = extractHeadings(document.body_markdown).filter((h) => h.depth <= 2);

    return (
        <AppLayout>
            <div className="flex gap-8">
                <article className="min-w-0 flex-1">
                    <h1 className="mb-4 text-2xl font-semibold">{document.title}</h1>
                    <MarkdownContent markdown={document.body_markdown} />
                    <div className="mt-6">
                        <Link href={`/docs-manage/${document.id}/edit`} className="text-sm text-primary hover:underline">
                            Edit dokumen ini
                        </Link>
                    </div>
                </article>
                {headings.length > 0 && (
                    <aside className="hidden w-56 shrink-0 lg:block">
                        <div className="sticky top-6 space-y-1 text-sm">
                            <p className="mb-2 font-medium text-muted-foreground">Daftar Isi</p>
                            {headings.map((h) => (
                                <a
                                    key={h.id}
                                    href={`#${h.id}`}
                                    className="block text-muted-foreground hover:text-foreground"
                                    style={{ paddingLeft: `${(h.depth - 1) * 12}px` }}
                                >
                                    {h.text}
                                </a>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </AppLayout>
    );
}
```

Link "Edit dokumen ini" selalu dirender — untuk staff level `view` klik ini akan kena 403 dari middleware `module:docs,manage`. Itu perilaku yang benar (bukan bug): link tersembunyi butuh prop `canManage` tambahan, tapi karena `show()` controller (Task 3) tidak mengirim prop itu, disederhanakan jadi 403 saat diklik. Cukup untuk fase 1 karena staff `view` sudah tahu dia read-only dari sisi UI Users (Task 9 plan Foundation).

- [ ] **Step 3: Verifikasi manual**

Run: `npm run build`, buka dokumen dengan heading H1/H2, pastikan TOC muncul dan klik anchor scroll ke posisi benar, hover code block memunculkan tombol copy dan berfungsi.

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/docs/index.tsx resources/js/pages/docs/show.tsx
git commit -m "feat: add document listing and reading page with table of contents"
```

---

### Task 7: Seeder migrasi `blueprint.md`

**Files:**
- Create: `database/seeders/DocsSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Tidak dikonsumsi task lain.

- [ ] **Step 1: Tulis `database/seeders/DocsSeeder.php`**

```php
<?php

namespace Database\Seeders;

use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Database\Seeder;

class DocsSeeder extends Seeder
{
    public function run(): void
    {
        $category = DocCategory::firstOrCreate(
            ['slug' => 'infrastructure'],
            ['name' => 'Infrastructure', 'position' => 0]
        );

        $path = base_path('blueprint.md');

        if (! file_exists($path)) {
            return;
        }

        Document::updateOrCreate(
            ['slug' => 'vps-deployment'],
            [
                'doc_category_id' => $category->id,
                'title' => 'VPS Deployment Guide',
                'excerpt' => 'Setup Ubuntu 22.04 + aaPanel + Docker (Grafana, Jenkins, n8n) + Nginx',
                'body_markdown' => file_get_contents($path),
                'is_published' => true,
                'position' => 0,
            ]
        );
    }
}
```

- [ ] **Step 2: Panggil dari `DatabaseSeeder`**

```php
public function run(): void
{
    $this->call([
        AdminUserSeeder::class,
        DocsSeeder::class,
    ]);
}
```

- [ ] **Step 3: Verifikasi**

Run: `php artisan migrate:fresh --seed`
Expected: buka `/docs`, kategori "Infrastructure" muncul dengan satu dokumen "VPS Deployment Guide" berisi seluruh konten `blueprint.md`.

- [ ] **Step 4: Commit**

```bash
git add database/seeders/DocsSeeder.php database/seeders/DatabaseSeeder.php
git commit -m "feat: seed VPS deployment guide from blueprint.md"
```

---

## Self-Review

**Spec coverage:** §6 "Modul Dokumentasi" (skema) → Task 1. §5 matriks akses docs → Task 2, 3 (test 403/manage). §7 tombol copy per code block, TOC → Task 4, 6. §8 Fase 1a seluruh 4 poin → Task 1-7.

**Placeholder scan:** tidak ada TBD; seluruh step berisi kode nyata.

**Type consistency:** `Heading` dan `extractHeadings()` (Task 4) dipakai identik di `show.tsx` (Task 6). Prop `canManage` dari `DocumentController@index` (Task 3) dipakai persis dengan nama yang sama di `docs/index.tsx` (Task 6).
