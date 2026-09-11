# Invoice Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modul invoice: master client, CRUD invoice dengan baris item dinamis, generator nomor tanpa reset, dan output PDF mengikuti template Pullstack Dev (logo, blok penerbit, tabel Job Description/Month/Subtotal, Payment Information + QR nomor invoice).

**Architecture:** `clients` dan `invoices` di `app/Modules/Invoice`. Baris item disimpan sebagai kolom `content` JSON di `invoices` (bukan tabel terpisah) karena tidak pernah di-query per baris. `client_name` di-snapshot saat invoice dibuat supaya invoice lama tidak berubah kalau data client diedit. PDF dirender server-side dengan dompdf dari template Blade, QR digenerate saat itu juga sebagai data URI PNG.

**Tech Stack:** Laravel 10, `barryvdh/laravel-dompdf`, `endroid/qr-code`, React 19 + TypeScript, Inertia.js.

**Spec:** `docs/superpowers/specs/2026-09-12-internal-cms-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-12-foundation.md` (AppLayout, middleware `module`, `Settings` helper, User model) harus sudah selesai. Tidak bergantung pada plan Docs module — keduanya independen begitu Foundation kelar.

## Global Constraints

- Nomor invoice format `INV/PSDEV/{NNN}/{DD}/{MM}/{YYYY}`, `NNN` = `sequence` padding 3 digit, **tidak pernah reset** (spec §7 "Format nomor").
- `client_name` di-snapshot saat invoice dibuat; edit master client tidak mengubah invoice lama (spec §6 "Modul Invoice").
- Item baris disimpan JSON di kolom `content`, bukan tabel terpisah (spec §6, alasan: tidak ada kebutuhan query per baris).
- Tidak ada pajak/diskon di fase 1 — total = jumlah `amount` semua item (dari brainstorming, "Tanpa pajak & diskon").
- QR berisi teks nomor invoice saja, digenerate lokal, bukan QRIS dinamis (spec §7, catatan QRIS).
- Kolom `Month` per baris default ke bulan berjalan saat form dibuka, tetap bisa diedit/dikosongkan manual.

---

## File Structure

**Backend (baru):**
- `database/migrations/*_create_clients_table.php`
- `database/migrations/*_create_invoices_table.php`
- `app/Modules/Invoice/Models/Client.php`
- `app/Modules/Invoice/Models/Invoice.php`
- `app/Modules/Invoice/Services/InvoiceNumberGenerator.php`
- `app/Modules/Invoice/Http/Controllers/ClientController.php`
- `app/Modules/Invoice/Http/Controllers/InvoiceController.php`
- `app/Modules/Invoice/Http/Controllers/InvoicePdfController.php`
- `app/Modules/Invoice/Http/Requests/StoreClientRequest.php`, `UpdateClientRequest.php`
- `app/Modules/Invoice/Http/Requests/StoreInvoiceRequest.php`, `UpdateInvoiceRequest.php`
- `resources/views/pdf/invoice.blade.php`

**Backend (dimodifikasi):**
- `composer.json` (dompdf, qr-code)
- `routes/modules/invoice.php`
- `database/seeders/DatabaseSeeder.php` (opsional data dummy — tidak wajib)

**Frontend (baru):**
- `resources/js/pages/invoice/clients/index.tsx`, `create.tsx`, `edit.tsx`
- `resources/js/pages/invoice/index.tsx`
- `resources/js/pages/invoice/create.tsx`, `edit.tsx`
- `resources/js/components/app/invoice-item-rows.tsx`
- `resources/js/lib/format.ts` (format Rupiah & tanggal Indonesia)

---

### Task 1: Install dompdf + qr-code, migration & model Client

**Files:**
- Modify: `composer.json`
- Create: `database/migrations/2026_09_12_020001_create_clients_table.php`
- Create: `app/Modules/Invoice/Models/Client.php`
- Create: `app/Modules/Invoice/Http/Controllers/ClientController.php`
- Create: `app/Modules/Invoice/Http/Requests/StoreClientRequest.php`, `UpdateClientRequest.php`
- Create: `routes/modules/invoice.php`
- Test: `tests/Feature/Invoice/ClientManagementTest.php`

**Interfaces:**
- Produces: `Client` model dengan `SoftDeletes` — dipakai `InvoiceController` (Task 4) untuk relasi dan snapshot.

- [ ] **Step 1: Install paket**

```bash
composer require barryvdh/laravel-dompdf endroid/qr-code
```

- [ ] **Step 2: Tulis migration `create_clients_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('npwp')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
```

- [ ] **Step 3: Tulis test lebih dulu — `tests/Feature/Invoice/ClientManagementTest.php`**

```php
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
```

- [ ] **Step 4: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=ClientManagementTest`
Expected: FAIL — route `/clients` belum ada.

- [ ] **Step 5: Tulis `app/Modules/Invoice/Models/Client.php`**

```php
<?php

namespace App\Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'email', 'phone', 'address', 'npwp'];
}
```

- [ ] **Step 6: Tulis `StoreClientRequest` dan `UpdateClientRequest`**

```php
<?php

namespace App\Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'npwp' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

```php
<?php

namespace App\Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'npwp' => ['nullable', 'string', 'max:50'],
        ];
    }
}
```

- [ ] **Step 7: Tulis `ClientController`**

```php
<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Http\Requests\StoreClientRequest;
use App\Modules\Invoice\Http\Requests\UpdateClientRequest;
use App\Modules\Invoice\Models\Client;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('invoice/clients/index', [
            'clients' => Client::orderBy('name')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('invoice/clients/create');
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        return redirect()->route('clients.index');
    }

    public function edit(Client $client): Response
    {
        return Inertia::render('invoice/clients/edit', ['client' => $client]);
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return redirect()->route('clients.index');
    }

    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()->route('clients.index');
    }
}
```

- [ ] **Step 8: Tulis `routes/modules/invoice.php`**

```php
<?php

use App\Modules\Invoice\Http\Controllers\ClientController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:invoice,view'])->group(function () {
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
});

Route::middleware(['auth', 'module:invoice,manage'])->group(function () {
    Route::get('/clients/create', [ClientController::class, 'create'])->name('clients.create');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::get('/clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
});
```

- [ ] **Step 9: Jalankan test, pastikan lulus**

Run: `php artisan migrate && php artisan test --filter=ClientManagementTest`
Expected: 4 passed.

- [ ] **Step 10: Commit**

```bash
git add composer.json composer.lock database/migrations app/Modules/Invoice/Models/Client.php app/Modules/Invoice/Http routes/modules/invoice.php tests/Feature/Invoice/ClientManagementTest.php
git commit -m "feat: add client CRUD and PDF/QR dependencies"
```

---

### Task 2: Migration & model `Invoice` + `InvoiceNumberGenerator`

**Files:**
- Create: `database/migrations/2026_09_12_020002_create_invoices_table.php`
- Create: `app/Modules/Invoice/Models/Invoice.php`
- Create: `app/Modules/Invoice/Services/InvoiceNumberGenerator.php`
- Test: `tests/Feature/Invoice/InvoiceNumberGeneratorTest.php`

**Interfaces:**
- Produces: `InvoiceNumberGenerator::next(\DateTimeInterface $issueDate): array{number: string, sequence: int}` — dipakai `InvoiceController` (Task 4).

- [ ] **Step 1: Tulis migration `create_invoices_table`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->unsignedInteger('sequence')->unique();
            $table->foreignId('client_id')->constrained();
            $table->string('client_name');
            $table->date('issue_date');
            $table->decimal('total', 15, 2)->default(0);
            $table->json('content');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
```

- [ ] **Step 2: Tulis `app/Modules/Invoice/Models/Invoice.php`**

```php
<?php

namespace App\Modules\Invoice\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'number', 'sequence', 'client_id', 'client_name',
        'issue_date', 'total', 'content', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'total' => 'decimal:2',
            'content' => 'array',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): array
    {
        return $this->content['items'] ?? [];
    }
}
```

- [ ] **Step 3: Tulis test lebih dulu — `tests/Feature/Invoice/InvoiceNumberGeneratorTest.php`**

```php
<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Invoice\Services\InvoiceNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_invoice_gets_sequence_one(): void
    {
        $result = app(InvoiceNumberGenerator::class)->next(new \DateTime('2026-09-05'));

        $this->assertSame(1, $result['sequence']);
        $this->assertSame('INV/PSDEV/001/05/09/2026', $result['number']);
    }

    public function test_sequence_keeps_incrementing_across_years(): void
    {
        $this->createInvoiceWithSequence(6, '2026-09-05');

        $result = app(InvoiceNumberGenerator::class)->next(new \DateTime('2027-01-10'));

        $this->assertSame(7, $result['sequence']);
        $this->assertSame('INV/PSDEV/007/10/01/2027', $result['number']);
    }

    public function test_number_and_sequence_are_unique_in_database(): void
    {
        $this->createInvoiceWithSequence(1, '2026-09-05');

        $this->expectException(\Illuminate\Database\QueryException::class);

        $this->createInvoiceWithSequence(1, '2026-09-06');
    }

    private function createInvoiceWithSequence(int $sequence, string $date): Invoice
    {
        $client = Client::create(['name' => 'Client']);
        $user = User::factory()->create();

        return Invoice::create([
            'number' => sprintf('INV/PSDEV/%03d/%s', $sequence, date('d/m/Y', strtotime($date))),
            'sequence' => $sequence,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => $date,
            'total' => 0,
            'content' => ['items' => []],
            'created_by' => $user->id,
        ]);
    }
}
```

- [ ] **Step 4: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=InvoiceNumberGeneratorTest`
Expected: FAIL — class `InvoiceNumberGenerator` belum ada.

- [ ] **Step 5: Tulis `app/Modules/Invoice/Services/InvoiceNumberGenerator.php`**

```php
<?php

namespace App\Modules\Invoice\Services;

use App\Modules\Invoice\Models\Invoice;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;

class InvoiceNumberGenerator
{
    /**
     * @return array{number: string, sequence: int}
     */
    public function next(DateTimeInterface $issueDate): array
    {
        return DB::transaction(function () use ($issueDate) {
            $lastSequence = Invoice::lockForUpdate()->max('sequence') ?? 0;
            $sequence = $lastSequence + 1;

            $number = sprintf(
                'INV/PSDEV/%03d/%s',
                $sequence,
                $issueDate->format('d/m/Y')
            );

            return ['number' => $number, 'sequence' => $sequence];
        });
    }
}
```

- [ ] **Step 6: Migrate dan jalankan test, pastikan lulus**

Run: `php artisan migrate && php artisan test --filter=InvoiceNumberGeneratorTest`
Expected: 3 passed.

- [ ] **Step 7: Commit**

```bash
git add database/migrations app/Modules/Invoice/Models/Invoice.php app/Modules/Invoice/Services tests/Feature/Invoice/InvoiceNumberGeneratorTest.php
git commit -m "feat: add invoice schema and sequential number generator"
```

---

### Task 3: `resources/js/lib/format.ts` — format Rupiah & tanggal Indonesia

**Files:**
- Create: `resources/js/lib/format.ts`

**Interfaces:**
- Produces: `formatRupiah(amount: number): string`, `formatIndonesianDate(isoDate: string): string` — dipakai halaman invoice (Task 6-7) dan bisa dipakai ulang di modul lain nanti.

- [ ] **Step 1: Tulis `resources/js/lib/format.ts`**

```ts
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
}

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatIndonesianDate(isoDate: string): string {
    const date = new Date(isoDate);
    return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function currentMonthLabel(): string {
    const date = new Date();
    return `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/lib/format.ts
git commit -m "feat: add Rupiah and Indonesian date formatters"
```

---

### Task 4: `InvoiceController` — create/store/update dengan snapshot & total

**Files:**
- Create: `app/Modules/Invoice/Http/Controllers/InvoiceController.php`
- Create: `app/Modules/Invoice/Http/Requests/StoreInvoiceRequest.php`, `UpdateInvoiceRequest.php`
- Modify: `routes/modules/invoice.php`
- Test: `tests/Feature/Invoice/InvoiceManagementTest.php`

**Interfaces:**
- Consumes: `InvoiceNumberGenerator` (Task 2), `Client` (Task 1).
- Produces: route `invoices.index/create/store/edit/update/destroy` — dipakai frontend Task 6.

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Invoice/InvoiceManagementTest.php`**

```php
<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceManagementTest extends TestCase
{
    use RefreshDatabase;

    private function manageUser(): User
    {
        $user = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $user->id, 'module' => 'invoice', 'level' => 'manage']);

        return $user;
    }

    public function test_view_level_staff_cannot_create_invoice(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'view']);

        $response = $this->actingAs($staff)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $response->assertForbidden();
    }

    public function test_creating_invoice_computes_total_and_snapshots_client_name(): void
    {
        $client = Client::create(['name' => 'Kolegium Orthopedi']);
        $user = $this->manageUser();

        $response = $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [
                ['description' => 'Advance Security for NIK', 'month' => '', 'amount' => 6500000],
                ['description' => 'Study Tracer', 'month' => 'September 2026', 'amount' => 3500000],
            ],
        ]);

        $response->assertRedirect('/invoices');

        $invoice = Invoice::first();
        $this->assertSame('10000000.00', $invoice->total);
        $this->assertSame('Kolegium Orthopedi', $invoice->client_name);
        $this->assertSame('INV/PSDEV/001/05/09/2026', $invoice->number);
        $this->assertSame($user->id, $invoice->created_by);
    }

    public function test_client_name_snapshot_survives_client_rename(): void
    {
        $client = Client::create(['name' => 'Nama Lama']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $client->update(['name' => 'Nama Baru']);

        $invoice = Invoice::first();
        $this->assertSame('Nama Lama', $invoice->client_name);
    }

    public function test_updating_invoice_recomputes_total(): void
    {
        $client = Client::create(['name' => 'Client']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $invoice = Invoice::first();

        $this->actingAs($user)->put("/invoices/{$invoice->id}", [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [
                ['description' => 'A', 'month' => '', 'amount' => 1000],
                ['description' => 'B', 'month' => '', 'amount' => 2000],
            ],
        ])->assertRedirect('/invoices');

        $this->assertSame('3000.00', $invoice->fresh()->total);
    }

    public function test_two_invoices_created_in_sequence_get_distinct_numbers(): void
    {
        $client = Client::create(['name' => 'Client']);
        $user = $this->manageUser();

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-05',
            'items' => [['description' => 'A', 'month' => '', 'amount' => 1000]],
        ]);

        $this->actingAs($user)->post('/invoices', [
            'client_id' => $client->id,
            'issue_date' => '2026-09-06',
            'items' => [['description' => 'B', 'month' => '', 'amount' => 2000]],
        ]);

        $numbers = Invoice::orderBy('sequence')->pluck('number');
        $this->assertSame(['INV/PSDEV/001/05/09/2026', 'INV/PSDEV/002/06/09/2026'], $numbers->toArray());
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=InvoiceManagementTest`
Expected: FAIL — route `/invoices` belum ada.

- [ ] **Step 3: Tulis `StoreInvoiceRequest` dan `UpdateInvoiceRequest`**

```php
<?php

namespace App\Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'exists:clients,id'],
            'issue_date' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.month' => ['nullable', 'string', 'max:100'],
            'items.*.amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
```

```php
<?php

namespace App\Modules\Invoice\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id' => ['required', 'exists:clients,id'],
            'issue_date' => ['required', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.month' => ['nullable', 'string', 'max:100'],
            'items.*.amount' => ['required', 'numeric', 'min:0'],
        ];
    }
}
```

- [ ] **Step 4: Tulis `InvoiceController`**

```php
<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Http\Requests\StoreInvoiceRequest;
use App\Modules\Invoice\Http\Requests\UpdateInvoiceRequest;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Invoice\Services\InvoiceNumberGenerator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('invoice/index', [
            'invoices' => Invoice::orderByDesc('sequence')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('invoice/create', [
            'clients' => Client::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreInvoiceRequest $request, InvoiceNumberGenerator $generator): RedirectResponse
    {
        $client = Client::findOrFail($request->validated('client_id'));
        $issueDate = $request->date('issue_date');
        $items = $request->validated('items');

        $generated = $generator->next($issueDate);

        Invoice::create([
            'number' => $generated['number'],
            'sequence' => $generated['sequence'],
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => $issueDate,
            'total' => collect($items)->sum('amount'),
            'content' => ['items' => $items],
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('invoices.index');
    }

    public function edit(Invoice $invoice): Response
    {
        return Inertia::render('invoice/edit', [
            'invoice' => $invoice,
            'clients' => Client::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        $items = $request->validated('items');

        $invoice->update([
            'client_id' => $request->validated('client_id'),
            'issue_date' => $request->date('issue_date'),
            'total' => collect($items)->sum('amount'),
            'content' => ['items' => $items],
        ]);

        return redirect()->route('invoices.index');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        $invoice->delete();

        return redirect()->route('invoices.index');
    }
}
```

`client_name` sengaja tidak ditimpa di `update()` — snapshot dikunci saat `store()`, mengganti client di invoice yang sudah ada tetap boleh (kasusnya jarang: salah pilih client saat draft), tapi nama tidak ikut auto-sync dari master supaya konsisten dengan aturan snapshot.

- [ ] **Step 5: Tambah route invoice ke `routes/modules/invoice.php`**

```php
<?php

use App\Modules\Invoice\Http\Controllers\ClientController;
use App\Modules\Invoice\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'module:invoice,view'])->group(function () {
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
});

Route::middleware(['auth', 'module:invoice,manage'])->group(function () {
    Route::get('/clients/create', [ClientController::class, 'create'])->name('clients.create');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::get('/clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

    Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
});
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `php artisan test --filter=InvoiceManagementTest`
Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add app/Modules/Invoice/Http/Controllers/InvoiceController.php app/Modules/Invoice/Http/Requests/StoreInvoiceRequest.php app/Modules/Invoice/Http/Requests/UpdateInvoiceRequest.php routes/modules/invoice.php tests/Feature/Invoice/InvoiceManagementTest.php
git commit -m "feat: add invoice CRUD with number generation and client snapshot"
```

---

### Task 5: Frontend — Client CRUD

**Files:**
- Create: `resources/js/pages/invoice/clients/index.tsx`
- Create: `resources/js/pages/invoice/clients/create.tsx`
- Create: `resources/js/pages/invoice/clients/edit.tsx`

**Interfaces:**
- Consumes: route `clients.*` (Task 1).

- [ ] **Step 1: Tulis `resources/js/pages/invoice/clients/index.tsx`**

```tsx
import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ClientRow {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
}

export default function ClientsIndex({ clients }: { clients: ClientRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Client"
                action={<Button asChild><Link href="/clients/create">Tambah Client</Link></Button>}
            />
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>{client.email ?? '-'}</TableCell>
                            <TableCell>{client.phone ?? '-'}</TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/clients/${client.id}/edit`}>Edit</Link>
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => router.delete(`/clients/${client.id}`)}
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

- [ ] **Step 2: Tulis `resources/js/pages/invoice/clients/create.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function CreateClient() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', phone: '', address: '', npwp: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/clients');
    }

    return (
        <AppLayout>
            <PageHeader title="Tambah Client" />
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                {(['name', 'email', 'phone', 'address', 'npwp'] as const).map((field) => (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="capitalize">{field}</Label>
                        <Input
                            id={field}
                            value={data[field]}
                            onChange={(e) => setData(field, e.target.value)}
                        />
                        {errors[field] && <p className="text-sm text-destructive">{errors[field]}</p>}
                    </div>
                ))}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Tulis `resources/js/pages/invoice/clients/edit.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ClientData {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    npwp: string | null;
}

export default function EditClient({ client }: { client: ClientData }) {
    const { data, setData, put, processing, errors } = useForm({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        npwp: client.npwp ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/clients/${client.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit ${client.name}`} />
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                {(['name', 'email', 'phone', 'address', 'npwp'] as const).map((field) => (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="capitalize">{field}</Label>
                        <Input
                            id={field}
                            value={data[field]}
                            onChange={(e) => setData(field, e.target.value)}
                        />
                        {errors[field] && <p className="text-sm text-destructive">{errors[field]}</p>}
                    </div>
                ))}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 4: Verifikasi manual**

Run: `npm run build`, login staff `invoice:manage`, buat client, edit, hapus.

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages/invoice/clients
git commit -m "feat: add client management UI"
```

---

### Task 6: `invoice-item-rows.tsx` + Frontend invoice create/edit/index

**Files:**
- Create: `resources/js/components/app/invoice-item-rows.tsx`
- Create: `resources/js/pages/invoice/create.tsx`
- Create: `resources/js/pages/invoice/edit.tsx`
- Create: `resources/js/pages/invoice/index.tsx`

**Interfaces:**
- Consumes: route `invoices.*` (Task 4), `formatRupiah`/`formatIndonesianDate`/`currentMonthLabel` (Task 3).
- Produces: `<InvoiceItemRows>` — komponen baris dinamis dipakai `create.tsx` dan `edit.tsx`.

- [ ] **Step 1: Tulis `resources/js/components/app/invoice-item-rows.tsx`**

```tsx
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';

export interface InvoiceItem {
    description: string;
    month: string;
    amount: number;
}

interface Props {
    items: InvoiceItem[];
    onChange: (items: InvoiceItem[]) => void;
    defaultMonth: string;
}

export function InvoiceItemRows({ items, onChange, defaultMonth }: Props) {
    function updateItem(index: number, patch: Partial<InvoiceItem>) {
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    }

    function addItem() {
        onChange([...items, { description: '', month: defaultMonth, amount: 0 }]);
    }

    function removeItem(index: number) {
        onChange(items.filter((_, i) => i !== index));
    }

    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-[1fr_140px_140px_40px] gap-2 text-sm font-medium text-muted-foreground">
                <span>Job Description</span>
                <span>Month</span>
                <span>Subtotal</span>
                <span />
            </div>
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_140px_40px] items-center gap-2">
                    <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="Deskripsi pekerjaan"
                    />
                    <Input
                        value={item.month}
                        onChange={(e) => updateItem(index, { month: e.target.value })}
                        placeholder="-"
                    />
                    <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Baris
            </Button>
            <div className="flex justify-end border-t pt-3 text-right">
                <span className="font-semibold">Total: {formatRupiah(total)}</span>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Tulis `resources/js/pages/invoice/create.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceItemRows, InvoiceItem } from '@/components/app/invoice-item-rows';
import { currentMonthLabel } from '@/lib/format';

interface ClientOption {
    id: number;
    name: string;
}

export default function CreateInvoice({ clients }: { clients: ClientOption[] }) {
    const defaultMonth = currentMonthLabel();
    const { data, setData, post, processing, errors } = useForm<{
        client_id: number;
        issue_date: string;
        items: InvoiceItem[];
    }>({
        client_id: clients[0]?.id ?? 0,
        issue_date: new Date().toISOString().slice(0, 10),
        items: [{ description: '', month: defaultMonth, amount: 0 }],
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/invoices');
    }

    return (
        <AppLayout>
            <PageHeader title="Invoice Baru" />
            <form onSubmit={submit} className="mt-4 max-w-3xl space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                            value={String(data.client_id)}
                            onValueChange={(v) => setData('client_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                            type="date"
                            value={data.issue_date}
                            onChange={(e) => setData('issue_date', e.target.value)}
                        />
                    </div>
                </div>

                <InvoiceItemRows
                    items={data.items}
                    onChange={(items) => setData('items', items)}
                    defaultMonth={defaultMonth}
                />
                {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}

                <Button type="submit" disabled={processing}>Buat Invoice</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 3: Tulis `resources/js/pages/invoice/edit.tsx`**

```tsx
import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceItemRows, InvoiceItem } from '@/components/app/invoice-item-rows';
import { currentMonthLabel } from '@/lib/format';

interface ClientOption {
    id: number;
    name: string;
}

interface InvoiceData {
    id: number;
    client_id: number;
    issue_date: string;
    content: { items: InvoiceItem[] };
}

export default function EditInvoice({ invoice, clients }: { invoice: InvoiceData; clients: ClientOption[] }) {
    const defaultMonth = currentMonthLabel();
    const { data, setData, put, processing, errors } = useForm<{
        client_id: number;
        issue_date: string;
        items: InvoiceItem[];
    }>({
        client_id: invoice.client_id,
        issue_date: invoice.issue_date.slice(0, 10),
        items: invoice.content.items,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/invoices/${invoice.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit Invoice #${invoice.id}`} />
            <form onSubmit={submit} className="mt-4 max-w-3xl space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                            value={String(data.client_id)}
                            onValueChange={(v) => setData('client_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                            type="date"
                            value={data.issue_date}
                            onChange={(e) => setData('issue_date', e.target.value)}
                        />
                    </div>
                </div>

                <InvoiceItemRows
                    items={data.items}
                    onChange={(items) => setData('items', items)}
                    defaultMonth={defaultMonth}
                />
                {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}

                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
```

- [ ] **Step 4: Tulis `resources/js/pages/invoice/index.tsx`**

```tsx
import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah, formatIndonesianDate } from '@/lib/format';
import { Download, Pencil } from 'lucide-react';

interface InvoiceRow {
    id: number;
    number: string;
    client_name: string;
    issue_date: string;
    total: string;
}

export default function InvoicesIndex({ invoices }: { invoices: InvoiceRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Invoice"
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild><Link href="/clients">Kelola Client</Link></Button>
                        <Button asChild><Link href="/invoices/create">Buat Invoice</Link></Button>
                    </div>
                }
            />
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nomor</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                            <TableCell>{invoice.client_name}</TableCell>
                            <TableCell>{formatIndonesianDate(invoice.issue_date)}</TableCell>
                            <TableCell className="text-right">{formatRupiah(Number(invoice.total))}</TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                        <Download className="mr-1 h-3.5 w-3.5" />
                                        PDF
                                    </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/invoices/${invoice.id}/edit`}>
                                        <Pencil className="mr-1 h-3.5 w-3.5" />
                                        Edit
                                    </Link>
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

- [ ] **Step 5: Verifikasi manual**

Run: `npm run build`, login staff `invoice:manage`, buat invoice dengan 2-3 baris item, cek total otomatis, edit, hapus baris.

- [ ] **Step 6: Commit**

```bash
git add resources/js/components/app/invoice-item-rows.tsx resources/js/pages/invoice/create.tsx resources/js/pages/invoice/edit.tsx resources/js/pages/invoice/index.tsx
git commit -m "feat: add invoice list and dynamic line-item editor UI"
```

---

### Task 7: PDF template + `InvoicePdfController` + QR

**Files:**
- Create: `resources/views/pdf/invoice.blade.php`
- Create: `app/Modules/Invoice/Http/Controllers/InvoicePdfController.php`
- Modify: `routes/modules/invoice.php`
- Test: `tests/Feature/Invoice/InvoicePdfTest.php`

**Interfaces:**
- Consumes: `Settings::get('invoice.issuer'/'invoice.payment')` (dari plan Foundation Task 4), `Invoice::items()` (Task 2).

- [ ] **Step 1: Tulis test lebih dulu — `tests/Feature/Invoice/InvoicePdfTest.php`**

```php
<?php

namespace Tests\Feature\Invoice;

use App\Models\User;
use App\Modules\Invoice\Models\Client;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Users\Models\ModuleUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicePdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_view_level_staff_can_download_pdf(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $user = User::factory()->create();
        $invoice = Invoice::create([
            'number' => 'INV/PSDEV/001/05/09/2026',
            'sequence' => 1,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => '2026-09-05',
            'total' => 1000,
            'content' => ['items' => [['description' => 'A', 'month' => '', 'amount' => 1000]]],
            'created_by' => $user->id,
        ]);

        $staff = User::factory()->create(['role' => 'staff']);
        ModuleUser::create(['user_id' => $staff->id, 'module' => 'invoice', 'level' => 'view']);

        $response = $this->actingAs($staff)->get("/invoices/{$invoice->id}/pdf");

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_staff_without_invoice_access_cannot_download_pdf(): void
    {
        $client = Client::create(['name' => 'Kolegium']);
        $user = User::factory()->create();
        $invoice = Invoice::create([
            'number' => 'INV/PSDEV/001/05/09/2026',
            'sequence' => 1,
            'client_id' => $client->id,
            'client_name' => $client->name,
            'issue_date' => '2026-09-05',
            'total' => 1000,
            'content' => ['items' => [['description' => 'A', 'month' => '', 'amount' => 1000]]],
            'created_by' => $user->id,
        ]);

        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get("/invoices/{$invoice->id}/pdf")->assertForbidden();
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `php artisan test --filter=InvoicePdfTest`
Expected: FAIL — route `/invoices/{id}/pdf` belum ada.

- [ ] **Step 3: Tulis `app/Modules/Invoice/Http/Controllers/InvoicePdfController.php`**

```php
<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Models\Invoice;
use App\Support\Settings\Settings;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Illuminate\Http\Response;

class InvoicePdfController extends Controller
{
    public function __invoke(Invoice $invoice, Settings $settings): Response
    {
        $qrResult = Builder::create()
            ->writer(new \Endroid\QrCode\Writer\PngWriter())
            ->data($invoice->number)
            ->encoding(new Encoding('UTF-8'))
            ->errorCorrectionLevel(ErrorCorrectionLevel::Low)
            ->size(160)
            ->margin(0)
            ->build();

        $qrDataUri = 'data:image/png;base64,'.base64_encode($qrResult->getString());

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'issuer' => $settings->get('invoice.issuer', [
                'name' => 'Pullstack Dev', 'address' => '', 'phone' => '', 'email' => '',
            ]),
            'payment' => $settings->get('invoice.payment', [
                'account_name' => '', 'bank' => '', 'account_number' => '',
            ]),
            'qrDataUri' => $qrDataUri,
        ]);

        return $pdf->stream("{$invoice->number}.pdf");
    }
}
```

- [ ] **Step 4: Tulis `resources/views/pdf/invoice.blade.php`**

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #1a1a1a; }
        .header { display: table; width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
        .header .brand { display: table-cell; vertical-align: top; font-size: 20px; font-weight: bold; }
        .header .issuer { display: table-cell; text-align: right; vertical-align: top; }
        .issuer p { margin: 2px 0; color: #444; }
        h1.title { font-size: 28px; margin: 0 0 16px 0; }
        .meta { display: table; width: 100%; margin-bottom: 20px; }
        .meta .left, .meta .right { display: table-cell; width: 50%; vertical-align: top; }
        .meta .right { text-align: right; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.items th { background: #e5e5e5; text-align: left; padding: 8px; font-size: 12px; }
        table.items th:last-child, table.items td:last-child { text-align: right; }
        table.items td { padding: 8px; border-bottom: 1px solid #eee; }
        .total-row td { background: #e5e5e5; font-weight: bold; padding: 10px 8px; }
        .payment { margin-top: 24px; border-top: 2px solid #1a1a1a; padding-top: 16px; }
        .payment p { margin: 2px 0; }
        .qr { margin-top: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">{{ $issuer['name'] }}</div>
        <div class="issuer">
            <p>{{ $issuer['address'] }}</p>
            <p>No : {{ $issuer['phone'] }}</p>
            <p>Email : {{ $issuer['email'] }}</p>
        </div>
    </div>

    <h1 class="title">INVOICE</h1>

    <div class="meta">
        <div class="left">
            <p><strong>Invoice No</strong> &nbsp; {{ $invoice->number }}</p>
            <p><strong>Date</strong> &nbsp; {{ \Carbon\Carbon::parse($invoice->issue_date)->translatedFormat('d F Y') }}</p>
        </div>
        <div class="right">
            <p><strong>To</strong> &nbsp; {{ $invoice->client_name }}</p>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Job Description</th>
                <th>Month</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items() as $item)
                <tr>
                    <td>{{ $item['description'] }}</td>
                    <td>{{ $item['month'] ?: '-' }}</td>
                    <td>{{ number_format($item['amount'], 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td></td>
                <td>Total</td>
                <td>{{ number_format($invoice->total, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment">
        <p><strong>Payment Information</strong></p>
        <p>{{ $payment['account_name'] }}</p>
        <p>Bank Account : {{ $payment['account_number'] }} ({{ $payment['bank'] }})</p>
        <div class="qr">
            <img src="{{ $qrDataUri }}" width="80" height="80">
        </div>
    </div>
</body>
</html>
```

- [ ] **Step 5: Tambah route PDF**

```php
Route::middleware(['auth', 'module:invoice,view'])->group(function () {
    // ...route index/clients yang sudah ada di Task 4...
    Route::get('/invoices/{invoice}/pdf', \App\Modules\Invoice\Http\Controllers\InvoicePdfController::class)->name('invoices.pdf');
});
```

- [ ] **Step 6: Terapkan konfigurasi dompdf (opsional font) dan jalankan test**

Run: `php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"` (kalau ingin ubah default paper size — tidak wajib untuk lulus test).

Run: `php artisan test --filter=InvoicePdfTest`
Expected: 2 passed.

- [ ] **Step 7: Verifikasi manual**

Run: buka `/invoices/{id}/pdf` di browser setelah login, bandingkan visual dengan template asli (header, tabel, Payment Information, QR).

- [ ] **Step 8: Commit**

```bash
git add resources/views/pdf app/Modules/Invoice/Http/Controllers/InvoicePdfController.php routes/modules/invoice.php tests/Feature/Invoice/InvoicePdfTest.php
git commit -m "feat: add invoice PDF rendering with QR code"
```

---

## Self-Review

**Spec coverage:** §6 skema `clients`/`invoices` → Task 1, 2. §7 format nomor, snapshot, layout PDF, QR → Task 2, 4, 7. §5 matriks akses invoice → Task 1, 4, 7 (test 403). §8 Fase 1b seluruh 4 poin → Task 1-7. Item brainstorming (tanpa pajak/diskon, Month auto dari hari ini) → `InvoiceItemRows` (Task 6) `defaultMonth={currentMonthLabel()}`, tidak ada field pajak di manapun.

**Placeholder scan:** tidak ada TBD; seluruh step berkode nyata termasuk Blade PDF lengkap.

**Type consistency:** `InvoiceItem` (Task 6) dipakai identik `{ description, month, amount }` di `create.tsx`/`edit.tsx`, dan cocok dengan `items.*.description/month/amount` di `StoreInvoiceRequest`/`UpdateInvoiceRequest` (Task 4). `InvoiceNumberGenerator::next()` return shape `{number, sequence}` (Task 2) dipakai persis di `InvoiceController@store` (Task 4).
