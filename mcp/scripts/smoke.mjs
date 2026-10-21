#!/usr/bin/env node
/**
 * Smoke test for the Pullstack Money MCP server.
 *
 * Talks real JSON-RPC over stdio to the server and proves the permission
 * model end-to-end against a running Pullstack app:
 *   1. tools/list contains all 11 tools
 *   2. get_balance works with a read-only token
 *   3. add_transaction is REJECTED with the read-only token (permission works)
 *   4. add_transaction is ACCEPTED with a write token (and cleaned up after)
 *
 * Required env:
 *   SMOKE_READ_TOKEN   Sanctum token with only money:read
 *   SMOKE_WRITE_TOKEN  Sanctum token with money:read + money:write
 *   SMOKE_WALLET_ID    id of an existing wallet to transact against
 * Optional env:
 *   PULLSTACK_API_URL  default http://127.0.0.1:8000
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_URL = process.env.PULLSTACK_API_URL || 'http://127.0.0.1:8000';
const READ_TOKEN = process.env.SMOKE_READ_TOKEN;
const WRITE_TOKEN = process.env.SMOKE_WRITE_TOKEN;
const WALLET_ID = Number(process.env.SMOKE_WALLET_ID || 0);

if (!READ_TOKEN || !WRITE_TOKEN || !WALLET_ID) {
    console.error('SMOKE GAGAL: env SMOKE_READ_TOKEN, SMOKE_WRITE_TOKEN, dan SMOKE_WALLET_ID wajib diisi.');
    process.exit(1);
}

const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.mjs');

const EXPECTED_TOOLS = [
    'get_balance', 'list_transactions', 'add_transaction', 'update_transaction',
    'delete_transaction', 'get_monthly_summary', 'list_categories', 'add_category',
    'list_wallets', 'get_budget_status', 'export_transactions_csv',
];

let failures = 0;
function check(label, ok, detail = '') {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
    if (!ok) failures += 1;
}

function startClient(token) {
    const proc = spawn('node', [serverPath], {
        env: { ...process.env, PULLSTACK_API_URL: API_URL, PULLSTACK_API_TOKEN: token },
        stdio: ['pipe', 'pipe', 'inherit'],
    });

    let buffer = '';
    const pending = new Map();
    let nextId = 1;

    proc.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (!line) continue;
            const message = JSON.parse(line);
            if (message.id !== undefined && pending.has(message.id)) {
                pending.get(message.id)(message);
                pending.delete(message.id);
            }
        }
    });

    function send(method, params) {
        const id = nextId++;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Timeout menunggu respons ${method}`)), 15000);
            pending.set(id, (message) => {
                clearTimeout(timeout);
                resolve(message);
            });
            proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
        });
    }

    function notify(method) {
        proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');
    }

    async function init() {
        const response = await send('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'pullstack-money-smoke', version: '0.1.0' },
        });
        notify('notifications/initialized');
        return response;
    }

    async function callTool(name, args) {
        const response = await send('tools/call', { name, arguments: args });
        return response.result;
    }

    return { proc, send, init, callTool };
}

// ---------- Run with the READ-ONLY token ----------
{
    const client = startClient(READ_TOKEN);
    try {
        const init = await client.init();
        check('initialize (read token)', !!init.result?.serverInfo, init.result?.serverInfo?.name ?? '');

        const list = await client.send('tools/list', {});
        const names = (list.result?.tools ?? []).map((t) => t.name);
        check('tools/list berisi 11 tools', EXPECTED_TOOLS.every((t) => names.includes(t)), names.join(', '));

        const balance = await client.callTool('get_balance', {});
        check('get_balance dengan token read-only', !balance?.isError, (balance?.content?.[0]?.text ?? '').slice(0, 80).replace(/\n/g, ' '));

        const rejected = await client.callTool('add_transaction', {
            wallet_id: WALLET_ID,
            type: 'expense',
            amount: 1000,
            date: new Date().toISOString().slice(0, 10),
            note: 'smoke test — harus ditolak',
        });
        const rejectText = rejected?.content?.[0]?.text ?? '';
        check(
            'add_transaction DITOLAK dengan token read-only (permission bekerja)',
            rejected?.isError === true && /403|money:write/.test(rejectText),
            rejectText.slice(0, 120),
        );
    } finally {
        client.proc.kill();
    }
}

// ---------- Run with the WRITE token ----------
{
    const client = startClient(WRITE_TOKEN);
    try {
        await client.init();

        const created = await client.callTool('add_transaction', {
            wallet_id: WALLET_ID,
            type: 'expense',
            amount: 1000,
            date: new Date().toISOString().slice(0, 10),
            note: 'smoke test MCP (akan dihapus)',
        });
        const createdText = created?.content?.[0]?.text ?? '';
        let createdId = null;
        try {
            createdId = JSON.parse(createdText)?.id ?? null;
        } catch { /* leave null */ }
        check('add_transaction DITERIMA dengan token write', !created?.isError && !!createdId, createdText.slice(0, 80).replace(/\n/g, ' '));

        if (createdId) {
            const deleted = await client.callTool('delete_transaction', { id: createdId });
            check('delete_transaction membersihkan data asap', !deleted?.isError);
        }
    } finally {
        client.proc.kill();
    }
}

console.log(failures === 0 ? '\nSMOKE MCP: SEMUA LULUS' : `\nSMOKE MCP: ${failures} KEGAGALAN`);
process.exit(failures === 0 ? 0 : 1);
