#!/usr/bin/env node
/**
 * Pullstack Money MCP server (stdio).
 *
 * Talks to the Pullstack Money Management REST API (/api/money) using a
 * Sanctum bearer token created in the "Token MCP" page of the web app.
 * The token's abilities are the permission system:
 *   money:read   - balances, transactions, summaries, budgets
 *   money:write  - create / update / delete transactions
 *   money:export - CSV export
 *   money:admin  - create categories & wallets
 *
 * Config (env):
 *   PULLSTACK_API_URL   default http://127.0.0.1:8000
 *   PULLSTACK_API_TOKEN required — Sanctum token from the Token MCP page
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = (process.env.PULLSTACK_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const API_TOKEN = process.env.PULLSTACK_API_TOKEN || '';

/** Tool name -> permission the API token needs for it. */
const TOOL_PERMISSIONS = {
    get_balance: 'money:read',
    list_transactions: 'money:read',
    add_transaction: 'money:write',
    update_transaction: 'money:write',
    delete_transaction: 'money:write',
    get_monthly_summary: 'money:read',
    list_categories: 'money:read',
    add_category: 'money:admin',
    list_wallets: 'money:read',
    get_budget_status: 'money:read',
    export_transactions_csv: 'money:export',
};

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function api(path, { method = 'GET', body } = {}) {
    if (!API_TOKEN) {
        throw new ApiError(0, 'PULLSTACK_API_TOKEN belum diatur. Buat token di halaman Token MCP pada aplikasi Pullstack, lalu pasang sebagai env PULLSTACK_API_TOKEN.');
    }

    let response;
    try {
        response = await fetch(`${API_URL}/api/money${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                Accept: 'application/json',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (cause) {
        throw new ApiError(0, `Tidak bisa menghubungi API Pullstack di ${API_URL} (${cause.message}). Pastikan aplikasi berjalan.`);
    }

    const text = await response.text();
    let parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch {
        /* non-JSON (e.g. CSV) */
    }

    if (!response.ok) {
        const message = parsed?.message || text.slice(0, 300) || `HTTP ${response.status}`;
        throw new ApiError(response.status, message);
    }

    return parsed ?? text;
}

function describeError(toolName, error) {
    const permission = TOOL_PERMISSIONS[toolName];
    if (error instanceof ApiError) {
        if (error.status === 401) {
            return `Autentikasi gagal (401): ${error.message} Token mungkin salah atau sudah di-revoke. Buat token baru di halaman Token MCP.`;
        }
        if (error.status === 403) {
            return `Ditolak (403): ${error.message} Tool "${toolName}" membutuhkan permission ${permission} pada token.`;
        }
        if (error.status === 422) {
            return `Validasi gagal (422): ${error.message}`;
        }
        return `Error ${error.status || ''}: ${error.message}`.trim();
    }
    return `Error: ${error.message}`;
}

/** Resolve wallet_name / category_name to ids via the read endpoints. */
async function resolveRefs(args) {
    const resolved = { ...args };

    if (resolved.wallet_id === undefined && resolved.wallet_name) {
        const { data } = await api('/wallets');
        const wallet = data.find((w) => w.name.toLowerCase() === String(resolved.wallet_name).toLowerCase());
        if (!wallet) {
            throw new ApiError(404, `Dompet bernama "${resolved.wallet_name}" tidak ditemukan. Panggil list_wallets untuk melihat pilihan.`);
        }
        resolved.wallet_id = wallet.id;
    }
    delete resolved.wallet_name;

    if (resolved.category_id === undefined && resolved.category_name) {
        const { data } = await api('/categories');
        const matches = data.filter((c) => c.name.toLowerCase() === String(resolved.category_name).toLowerCase());
        const category = matches.find((c) => !resolved.type || c.kind === resolved.type) ?? matches[0];
        if (!category) {
            throw new ApiError(404, `Kategori bernama "${resolved.category_name}" tidak ditemukan. Panggil list_categories untuk melihat pilihan.`);
        }
        resolved.category_id = category.id;
    }
    delete resolved.category_name;

    return resolved;
}

function queryString(params) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
    return entries.length ? `?${new URLSearchParams(entries).toString()}` : '';
}

const TOOLS = [
    {
        name: 'get_balance',
        description: 'Saldo total keuangan Pullstack dan saldo per dompet (dompet = rekening/kas). Permission: money:read.',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => api('/balance'),
    },
    {
        name: 'list_transactions',
        description: 'Daftar transaksi pemasukan/pengeluaran. Filter opsional: month (YYYY-MM), wallet_id, category_id, type (income|expense), q (cari di catatan), per_page (1-100, default 25). Permission: money:read.',
        inputSchema: {
            type: 'object',
            properties: {
                month: { type: 'string', description: 'Format YYYY-MM' },
                wallet_id: { type: 'integer' },
                category_id: { type: 'integer' },
                type: { type: 'string', enum: ['income', 'expense'] },
                q: { type: 'string' },
                per_page: { type: 'integer' },
            },
        },
        handler: async (args) => api(`/transactions${queryString(args)}`),
    },
    {
        name: 'add_transaction',
        description: 'Catat transaksi baru. Wajib: wallet_id (atau wallet_name), type (income|expense), amount (rupiah, > 0), date (YYYY-MM-DD). Opsional: category_id (atau category_name), note, invoice_id, mark_paid (true = tandai invoice terkait lunas). Permission: money:write.',
        inputSchema: {
            type: 'object',
            required: ['type', 'amount', 'date'],
            properties: {
                wallet_id: { type: 'integer' },
                wallet_name: { type: 'string' },
                category_id: { type: 'integer' },
                category_name: { type: 'string' },
                type: { type: 'string', enum: ['income', 'expense'] },
                amount: { type: 'integer', description: 'Nominal rupiah, bilangan bulat > 0' },
                date: { type: 'string', description: 'YYYY-MM-DD' },
                note: { type: 'string' },
                invoice_id: { type: 'integer' },
                mark_paid: { type: 'boolean' },
            },
        },
        handler: async (args) => api('/transactions', { method: 'POST', body: await resolveRefs(args) }),
    },
    {
        name: 'update_transaction',
        description: 'Ubah transaksi yang sudah ada. Wajib: id. Field lain sama seperti add_transaction dan semuanya opsional. Permission: money:write.',
        inputSchema: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'integer' },
                wallet_id: { type: 'integer' },
                wallet_name: { type: 'string' },
                category_id: { type: 'integer' },
                category_name: { type: 'string' },
                type: { type: 'string', enum: ['income', 'expense'] },
                amount: { type: 'integer' },
                date: { type: 'string', description: 'YYYY-MM-DD' },
                note: { type: 'string' },
                invoice_id: { type: 'integer' },
                mark_paid: { type: 'boolean' },
            },
        },
        handler: async (args) => {
            const { id, ...rest } = await resolveRefs(args);
            return api(`/transactions/${id}`, { method: 'PATCH', body: rest });
        },
    },
    {
        name: 'delete_transaction',
        description: 'Hapus transaksi berdasarkan id. Saldo dompet terkait ikut berubah. Permission: money:write.',
        inputSchema: {
            type: 'object',
            required: ['id'],
            properties: { id: { type: 'integer' } },
        },
        handler: async (args) => api(`/transactions/${args.id}`, { method: 'DELETE' }),
    },
    {
        name: 'get_monthly_summary',
        description: 'Ringkasan satu bulan: saldo awal, total pemasukan, total pengeluaran, sisa, saldo akhir, rincian per kategori, dan anggaran vs realisasi. month format YYYY-MM (default bulan ini). Permission: money:read.',
        inputSchema: {
            type: 'object',
            properties: { month: { type: 'string', description: 'Format YYYY-MM' } },
        },
        handler: async (args) => api(`/summary${queryString(args)}`),
    },
    {
        name: 'list_categories',
        description: 'Daftar kategori pemasukan dan pengeluaran beserta warna dan status aktifnya. Permission: money:read.',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => api('/categories'),
    },
    {
        name: 'add_category',
        description: 'Buat kategori baru. Wajib: name, kind (income|expense). Opsional: color (hex, cth. #dc2626). Permission: money:admin.',
        inputSchema: {
            type: 'object',
            required: ['name', 'kind'],
            properties: {
                name: { type: 'string' },
                kind: { type: 'string', enum: ['income', 'expense'] },
                color: { type: 'string' },
            },
        },
        handler: async (args) => api('/categories', { method: 'POST', body: args }),
    },
    {
        name: 'list_wallets',
        description: 'Daftar dompet (rekening/kas/e-wallet) beserta saldo berjalannya. Permission: money:read.',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => api('/wallets'),
    },
    {
        name: 'get_budget_status',
        description: 'Status anggaran per kategori pengeluaran untuk satu bulan: anggaran, realisasi, sisa, dan persen terpakai. month format YYYY-MM (default bulan ini). Permission: money:read.',
        inputSchema: {
            type: 'object',
            properties: { month: { type: 'string', description: 'Format YYYY-MM' } },
        },
        handler: async (args) => api(`/budgets${queryString(args)}`),
    },
    {
        name: 'export_transactions_csv',
        description: 'Ekspor semua transaksi satu bulan sebagai teks CSV (tanggal, tipe, kategori, dompet, catatan, nominal bertanda +/-). month format YYYY-MM (default bulan ini). Permission: money:export.',
        inputSchema: {
            type: 'object',
            properties: { month: { type: 'string', description: 'Format YYYY-MM' } },
        },
        handler: async (args) => {
            const csv = await api(`/export${queryString({ month: args.month, format: 'csv' })}`);
            return { rawText: typeof csv === 'string' ? csv : JSON.stringify(csv) };
        },
    },
];

const server = new Server(
    { name: 'pullstack-money', version: '0.1.0' },
    { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
        return {
            content: [{ type: 'text', text: `Tool tidak dikenal: ${request.params.name}` }],
            isError: true,
        };
    }

    try {
        const result = await tool.handler(request.params.arguments ?? {});
        const text = result?.rawText ?? JSON.stringify(result?.data ?? result, null, 2);
        return { content: [{ type: 'text', text }] };
    } catch (error) {
        return {
            content: [{ type: 'text', text: describeError(tool.name, error) }],
            isError: true,
        };
    }
});

await server.connect(new StdioServerTransport());
console.error(`pullstack-money MCP server running (API: ${API_URL})`);
