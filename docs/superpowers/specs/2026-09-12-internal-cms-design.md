# Pullstack Internal CMS — Design

**Tanggal:** 2026-09-12
**Status:** Menunggu review
**Repo:** `internal-pullstack`

## 1. Ringkasan

Merombak total situs dokumentasi publik yang ada sekarang menjadi **CMS internal Pullstack**: satu aplikasi Laravel + Inertia + React di belakang login, berisi menu-menu internal yang bisa ditambah seiring waktu.

Dua modul untuk fase pertama:

1. **Dokumentasi** — konten runbook VPS yang sekarang hardcoded di komponen Vue dipindah ke database sebagai markdown yang bisa diedit dari dashboard.
2. **Invoice** — generate invoice PDF mengikuti template Pullstack Dev yang sudah berjalan.

Tidak ada halaman publik. Root aplikasi mengarah ke login.

## 2. Audit kondisi sekarang

| Bagian | Kondisi | Nasib |
|---|---|---|
| `routes/web.php` | 2 route closure, `Inertia::render` langsung, tanpa controller | Ditulis ulang |
| `resources/js/Pages/Home.vue` | Landing marketing statis | Dihapus |
| `resources/js/Pages/Documentation.vue` | Runbook VPS hardcoded di template Vue | Dihapus, isinya dipindah ke DB |
| Auth | Tidak ada. Hanya model `User` bawaan, Sanctum terpasang tapi tak terpakai | Dibangun baru |
| Database | Hanya migration bawaan Laravel | Ditambah tabel modul |
| Build | Laravel Mix + `webpack.mix.js` + `public/mix-manifest.json` | Diganti Vite |
| Frontend | Vue 3 + `@inertiajs/vue3` | Diganti React 19 + TypeScript |
| Tailwind | Kacau: config v3, tapi package `@tailwindcss/postcss` v4 ikut terpasang | Dibersihkan ke v4 murni |
| `blueprint.md` | Runbook VPS dalam markdown | Dipakai sebagai isi dokumen pertama |
| Tests | Hanya stub `ExampleTest` bawaan | Diganti test asli per modul |

Nyaris tidak ada yang dipertahankan. Yang bernilai dari kode lama hanya **isi kontennya**, bukan strukturnya.

## 3. Stack

Laravel 10 dipertahankan (tidak upgrade ke 12). PHP 8.1+, VPS produksi sudah PHP 8.3.

**Ditambahkan:**

| Paket | Kegunaan |
|---|---|
| `@inertiajs/react` | Adapter Inertia untuk React |
| React 19 + TypeScript | Frontend |
| Vite + `laravel-vite-plugin` | Build (plugin sudah ada di repo) |
| Tailwind v4 + shadcn/ui | Desain sistem |
| `lucide-react` | Ikon |
| `react-markdown` + `remark-gfm` | Render markdown dokumentasi |
| `barryvdh/laravel-dompdf` | Render PDF invoice |
| `endroid/qr-code` | Generate QR invoice |

**Dihapus:** `vue`, `@inertiajs/vue3`, `vue-loader`, `laravel-mix`, `webpack.mix.js`, `postcss.config.js`, `tailwind.config.js`, `public/js`, `public/css`, `public/mix-manifest.json`, `resources/views/welcome.blade.php`.

### Keputusan: auth tanpa Breeze

Login dibangun manual dengan `Auth` facade bawaan Laravel, bukan `laravel/breeze`.

Alasan: Breeze men-generate register, verifikasi email, dan konfirmasi password — semuanya harus dihapus karena aplikasi ini invite-only. Selain itu repo sudah memakai `inertiajs/inertia-laravel ^2.0` yang berisiko bentrok dengan versi Breeze untuk Laravel 10. Login manual hanya butuh satu controller dan satu halaman, dan memberi kendali penuh atas tampilan shadcn.

### Keputusan: `endroid/qr-code`, bukan `simple-qrcode`

`simple-qrcode` butuh ekstensi Imagick untuk output PNG. `endroid/qr-code` bisa menghasilkan PNG lewat GD yang sudah pasti ada, dan PNG-nya bisa disisipkan ke dompdf sebagai data URI tanpa masalah. dompdf sendiri dukungan SVG-nya lemah, jadi PNG wajib.

## 4. Arsitektur modul

Satu aplikasi Laravel dengan batas modul ditegakkan lewat struktur folder. Bukan sub-app terpisah, bukan `nwidart/laravel-modules`.

Alasan: sub-app terpisah + SSO baru terbayar kalau tiap modul punya tim, siklus rilis, atau skala yang berbeda. Di sini semua modul CRUD sederhana, satu tim, satu VPS — SSO hanya menambah beban operasional. `nwidart` membuat autoload dan resolusi halaman Inertia/Vite jadi custom, dan baru terbayar di belasan modul.

```
app/
  Modules/
    Docs/
      Http/Controllers/    Http/Requests/    Models/    Policies/
    Invoice/
      Http/Controllers/    Http/Requests/    Models/    Policies/    Services/
    Users/
      Http/Controllers/    Http/Requests/
    Settings/
      Http/Controllers/    Http/Requests/
  Support/
    Modules/ModuleRegistry.php      # sumber tunggal daftar modul + menu sidebar
    Settings/Settings.php           # pembaca/penulis tabel settings
routes/
  web.php                           # tipis, hanya require file modul
  modules/docs.php
  modules/invoice.php
  modules/users.php
  modules/settings.php
resources/js/
  layouts/app-layout.tsx            # sidebar + topbar
  components/ui/                    # shadcn — jangan diedit manual
  components/app/                   # DataTable, PageHeader, EmptyState
  pages/auth/login.tsx
  pages/dashboard.tsx
  pages/docs/
  pages/invoice/
  pages/users/
  pages/settings/
```

Namespace `App\Modules\Invoice\Models\Invoice`. PSR-4 `App\` yang sudah ada sudah meng-cover; `composer.json` tidak perlu diubah.

Migration tetap di `database/migrations` (urutan timestamp penting untuk foreign key).

**Aturan batas:** modul tidak boleh meng-import kelas dari modul lain. Kalau butuh sesuatu bersama, taruh di `app/Support`. Aturan ini yang membuat sebuah modul bisa diangkat keluar nanti tanpa mengurai dependensi.

## 5. Auth & hak akses

Invite-only. Tidak ada route register. Akun dibuat admin dari halaman Users.

**Peran:**

- **Admin** — akses penuh semua modul, kelola user, kelola settings.
- **Staff** — hanya modul yang di-assign, dengan level per modul.

**Mekanisme:**

- Kolom `users.role` — enum `admin` | `staff`.
- Tabel `module_user` — `user_id`, `module` (`docs` / `invoice`), `level` (`view` / `manage`).
- `Gate::before` meloloskan admin dari semua pengecekan, jadi admin tidak perlu di-assign apa pun.
- Middleware `module:docs,view` menjaga tiap route group modul.
- Sidebar dirender dari `ModuleRegistry` yang sudah difilter hak akses — staff tidak melihat menu yang tidak bisa dia buka.

**Matriks akses:**

| Modul | Admin | Staff `manage` | Staff `view` | Tanpa assign |
|---|---|---|---|---|
| Dokumentasi | penuh | CRUD dokumen & kategori | baca saja | menu tidak muncul |
| Invoice | penuh | CRUD invoice & client, download PDF | lihat daftar + download PDF | menu tidak muncul |
| Users | penuh | — | — | menu tidak muncul |
| Settings | penuh | — | — | menu tidak muncul |

Users dan Settings khusus admin, tidak bisa di-assign ke staff.

## 6. Skema database

### Inti

```
users                                   (ubah tabel bawaan)
  role              enum('admin','staff') default 'staff'
  is_active         boolean default true      -- nonaktifkan orang tanpa hapus datanya

module_user
  user_id           FK users cascade
  module            string
  level             enum('view','manage')
  unique(user_id, module)

settings
  code              string unique             -- 'invoice.issuer', 'invoice.payment'
  content           json
```

`password_reset_tokens` bawaan dibiarkan ada, tapi tanpa route publik di fase 1. Reset password dilakukan admin dari halaman Users.

**Settings** sengaja key-value dengan `content` JSON supaya pengaturan baru tidak butuh migration. Isi awal (di-seed):

- `invoice.issuer` → `{ name, address, phone, email, logo_path }`
- `invoice.payment` → `{ account_name, bank, account_number }`

### Modul Dokumentasi

```
doc_categories
  name              string
  slug              string unique
  description       string nullable
  position          integer default 0

documents
  doc_category_id   FK doc_categories
  title             string
  slug              string unique             -- URL /docs/{slug}
  body_markdown     longtext
  excerpt           string nullable
  position          integer default 0
  is_published      boolean default false
  created_by        FK users nullable
  updated_by        FK users nullable
```

Slug unik global, bukan unik per kategori — supaya dokumen bisa dipindah kategori tanpa URL-nya berubah.

### Modul Invoice

```
clients
  name              string
  email, phone, address, npwp     nullable
  softDeletes                               -- hapus client tidak memutus relasi invoice

invoices
  number            string unique           -- INV/PSDEV/006/05/09/2026
  sequence          unsignedInteger unique  -- 6, angka urut mentah untuk generator
  client_id         FK clients
  client_name       string                  -- snapshot saat invoice dibuat
  issue_date        date
  total             decimal(15,2)           -- dihitung ulang tiap simpan
  content           json
  created_by        FK users
```

**Bentuk `content`:**

```json
{
  "items": [
    { "description": "Advance Security for NIK", "month": "", "amount": 6500000 },
    { "description": "Study Tracer / Alumni Tracking", "month": "September 2026", "amount": 3500000 }
  ]
}
```

Item baris disimpan sebagai JSON, bukan tabel terpisah, karena tidak ada kebutuhan query atau agregasi per baris — baris invoice hanya dicetak. Ini juga membuat perubahan kolom template tidak butuh migration.

Sebaliknya `number`, `sequence`, `client_id`, `issue_date`, dan `total` tetap kolom asli karena dipakai untuk sorting daftar, filter periode, index unik nomor, dan rekap. Kalau ikut masuk JSON, mencari invoice bulan lalu berarti scan seluruh tabel.

**Snapshot `client_name`** penting: tanpa itu, mengganti nama client membuat invoice tahun lalu ikut berubah, dan invoice jadi tidak bisa dipertanggungjawabkan. Template hanya mencetak nama penerima, jadi hanya nama yang di-snapshot; alamat/NPWP tetap tersimpan di master client untuk keperluan lain.

Client memakai soft delete, jadi menghapus client tidak pernah benar-benar memutus relasi — invoice lama tetap bisa ditelusuri ke master client-nya, dan `client_name` menjamin cetakannya tetap benar apa pun yang terjadi pada master.

## 7. Detail modul Invoice

### Format nomor

```
INV/PSDEV/{NNN}/{DD}/{MM}/{YYYY}
INV/PSDEV/006/05/09/2026
```

`NNN` adalah `sequence` dengan padding 3 digit, **tidak pernah reset** — invoice ke-6 sejak awal tetap 006 walau berganti tahun. Tanggal diambil dari `issue_date`.

`InvoiceNumberGenerator` mengambil `MAX(sequence) + 1` di dalam transaksi dengan `lockForUpdate()`, supaya dua orang yang menyimpan bersamaan tidak mendapat nomor kembar. Index unik di `number` dan `sequence` jadi jaring pengaman terakhir.

### Layout PDF

Mengikuti template yang diberikan:

- **Header** — logo kiri, blok penerbit kanan (nama, alamat, No, Email), garis bawah.
- **Judul** `INVOICE`, lalu `Invoice No` + `Date` di kiri, `To` + nama client di kanan.
- **Tabel** — kolom `Job Description` | `Month` | `Subtotal`, header berlatar abu.
- **Baris Total** — berlatar abu, nominal di kotak putih.
- **Payment Information** — nama pemilik rekening, `Bank Account : <nomor> (<bank>)`, lalu QR.

Angka diformat gaya Indonesia tanpa desimal dan tanpa prefiks `Rp`: `11.000.000`. Tanggal ditulis `05 September 2026` (locale Indonesia).

QR berisi **teks nomor invoice** — dipakai sebagai penanda sementara. Digenerate saat render PDF lewat `endroid/qr-code`, disisipkan sebagai data URI PNG. Tidak disimpan sebagai file.

> Catatan: QRIS dinamis (nominal menempel di QR) tidak bisa digenerate sendiri — harus keluar dari acquirer/payment gateway tempat mendaftar merchant. Kalau nanti dibutuhkan, itu fase tersendiri.

Logo diupload lewat Settings, disimpan di `storage/app/public`, dan dibaca dompdf dari path lokal (bukan URL). **Aset logo belum tersedia** — sampai diberikan, dipakai placeholder.

Font bawaan dompdf terbatas. Satu font TTF geometric sans didaftarkan agar hasil mendekati template.

### Kolom Month

Baris item baru otomatis terisi bulan berjalan saat form dibuka (mis. `September 2026`), dan bisa ditimpa manual — dikosongkan untuk pekerjaan sekali jalan, atau diisi rentang seperti `Jul-Sep 2026`.

## 8. Urutan fase

### Fase 0 — Fondasi

Tidak ada fitur yang terlihat user, tapi wajib duluan.

1. Bongkar Vue + Mix, pasang Vite + React + TypeScript + Tailwind v4 + shadcn
2. App shell: layout sidebar + topbar
3. Login, logout, middleware auth
4. `ModuleRegistry` + middleware akses modul
5. CRUD user + assign akses modul (admin)
6. Halaman Settings (admin)
7. Dashboard kosong sebagai landing setelah login

### Fase 1a — Modul Dokumentasi

1. CRUD kategori
2. CRUD dokumen dengan editor markdown (textarea + tab preview)
3. Halaman baca: daftar isi otomatis dari heading, tombol copy per blok kode
4. Seeder memindahkan isi `blueprint.md` menjadi dokumen pertama di kategori Infrastructure

Tombol copy per blok kode adalah kelanjutan fitur click-to-copy dari `/docs` yang lama.

### Fase 1b — Modul Invoice

1. CRUD client
2. CRUD invoice dengan baris item dinamis dan total otomatis
3. `InvoiceNumberGenerator`
4. Template Blade PDF + route download + QR

### Fase 2 — belum dikerjakan

Status pembayaran dan rekap, modul-modul internal berikutnya, reset password mandiri, QRIS dinamis.

## 9. Testing

`phpunit.xml` saat ini punya baris sqlite in-memory yang masih dikomentari. Baris itu diaktifkan supaya test punya database sendiri dan tidak menyentuh database dev.

Yang diuji:

**Akses**

- Guest ditolak dari seluruh route internal
- Staff tanpa assign modul mendapat 403
- Staff level `view` ditolak saat POST / PUT / DELETE
- Admin lolos semua tanpa perlu assign
- Sidebar hanya memuat modul yang boleh diakses

**Dokumentasi**

- CRUD kategori dan dokumen
- Slug unik dan otomatis dari judul
- Dokumen `is_published = false` tidak muncul di daftar baca

**Invoice**

- Total sama dengan jumlah `amount` seluruh item
- Nomor unik saat dua invoice dibuat bersamaan
- Format nomor sesuai `INV/PSDEV/NNN/DD/MM/YYYY`
- `client_name` ter-snapshot dan tidak berubah saat master client diedit
- Route PDF mengembalikan `application/pdf`

## 10. Hal yang belum ditentukan

- **Aset logo** belum diberikan. Placeholder dipakai sampai tersedia.
- **Isi QR** saat ini nomor invoice sebagai penanda sementara, menunggu keputusan final.
