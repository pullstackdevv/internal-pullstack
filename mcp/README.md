# Pullstack Money MCP Server

Server MCP (Model Context Protocol) yang memberi agent AI akses ke modul
**Keuangan (Money Management)** di aplikasi Pullstack: saldo, transaksi
pemasukan/pengeluaran, ringkasan bulanan, anggaran, kategori, dompet, dan
ekspor CSV.

Server ini adalah klien tipis: semua data dan aturan bisnis tetap di REST API
Pullstack (`/api/money`). Keamanan diatur oleh **token Sanctum** — permission
token adalah permission agent.

## Permission (scope token)

| Scope         | Untuk |
|---------------|-------|
| `money:read`   | Baca saldo, transaksi, ringkasan, anggaran, kategori, dompet |
| `money:write`  | Tambah / ubah / hapus transaksi |
| `money:export` | Ekspor CSV |
| `money:admin`  | Buat kategori & dompet lewat API |

Token yang kekurangan scope akan ditolak API dengan 403, dan server MCP
meneruskan penolakan itu sebagai pesan error yang menyebut permission yang
dibutuhkan. Contoh prinsip least-privilege: agent pelaporan cukup diberi
`money:read` (+ `money:export` bila perlu unduhan), agent pencatat diberi
`money:read` + `money:write`.

## 1. Buat token di aplikasi Pullstack

1. Login sebagai **admin** ke aplikasi Pullstack.
2. Buka menu **Keuangan → Token MCP** (`/money/api-tokens`).
3. Isi nama token (cth. "Agent Keuangan"), centang scope yang dibutuhkan, klik **Buat token**.
4. Salin token yang tampil — **hanya tampil sekali**. Token bisa di-revoke kapan pun dari halaman yang sama.

## 2. Install

Butuh Node.js ≥ 18 (disarankan v24). Dari folder ini (`mcp/` di root repo):

```bash
npm install
```

Tidak ada langkah build — server berjalan langsung dari `src/index.mjs`.

## 3. Konfigurasi

Env yang dibaca server:

| Env | Wajib | Default | Keterangan |
|-----|-------|---------|------------|
| `PULLSTACK_API_TOKEN` | ya | — | Token Sanctum dari halaman Token MCP |
| `PULLSTACK_API_URL` | tidak | `http://127.0.0.1:8000` | Base URL aplikasi Pullstack (tanpa `/api`) |

Token **tidak pernah** ditulis di kode atau file konfigurasi repo — selalu lewat env.

## 4. Contoh konfigurasi MCP client

Claude Code / Muse dan client MCP lain yang memakai blok `mcpServers`:

```json
{
  "mcpServers": {
    "pullstack-money": {
      "command": "node",
      "args": ["/path/ke/repo/mcp/src/index.mjs"],
      "env": {
        "PULLSTACK_API_URL": "http://127.0.0.1:8000",
        "PULLSTACK_API_TOKEN": "<token-dari-halaman-token-mcp>"
      }
    }
  }
}
```

Pastikan aplikasi Pullstack sedang berjalan (`php artisan serve`) sebelum client MCP dipakai.

## 5. Tools

| Tool | Permission | Keterangan |
|------|-----------|------------|
| `get_balance` | `money:read` | Saldo total + saldo per dompet |
| `list_transactions` | `money:read` | Daftar transaksi; filter `month`, `wallet_id`, `category_id`, `type`, `q`, `per_page` |
| `add_transaction` | `money:write` | Catat transaksi; terima `wallet_id`/`wallet_name`, `category_id`/`category_name`, `type`, `amount` (rupiah), `date`, `note`, `invoice_id`, `mark_paid` |
| `update_transaction` | `money:write` | Ubah transaksi berdasarkan `id` |
| `delete_transaction` | `money:write` | Hapus transaksi berdasarkan `id` |
| `get_monthly_summary` | `money:read` | Ringkasan bulan: saldo awal/akhir, masuk/keluar, per kategori, anggaran vs realisasi |
| `list_categories` | `money:read` | Semua kategori pemasukan & pengeluaran |
| `add_category` | `money:admin` | Buat kategori baru (`name`, `kind`, `color` opsional) |
| `list_wallets` | `money:read` | Semua dompet + saldonya |
| `get_budget_status` | `money:read` | Anggaran vs realisasi per kategori untuk satu bulan |
| `export_transactions_csv` | `money:export` | CSV semua transaksi satu bulan |

Alur yang disarankan untuk agent: panggil `list_wallets` dan `list_categories`
dulu untuk mengetahui id/nama yang valid, baru `add_transaction`.

## 6. Uji asap (smoke test)

Dengan aplikasi berjalan dan dua token sungguhan (satu read-only, satu read+write):

```bash
SMOKE_READ_TOKEN=<token-read> \
SMOKE_WRITE_TOKEN=<token-write> \
SMOKE_WALLET_ID=<id-dompet> \
npm run smoke
```

Skrip `scripts/smoke.mjs` menjalankan JSON-RPC sungguhan ke server:
`tools/list` harus berisi 11 tools, `get_balance` sukses dengan token
read-only, `add_transaction` **ditolak** dengan token read-only (bukti
permission bekerja), dan **diterima** dengan token write (lalu dibersihkan).
