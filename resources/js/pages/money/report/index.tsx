import * as React from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatIndonesianDate, formatRupiah } from '@/lib/format';

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface CategoryTotal {
    category_id: number | null;
    name: string;
    color: string;
    kind: 'income' | 'expense';
    total: number;
}

interface Summary {
    month: string;
    opening_balance: number;
    total_income: number;
    total_expense: number;
    net: number;
    closing_balance: number;
    by_category: CategoryTotal[];
}

interface TxRow {
    id: number;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    note: string | null;
    wallet_name: string | null;
    category_name: string | null;
    category_color: string | null;
}

interface Props {
    month: string;
    companyName: string;
    summary: Summary;
    transactions: TxRow[];
    tsv: string;
    sheetsWebhookUrl: string;
    sheetsResult: { ok: boolean; message: string } | null;
}

function monthLabel(month: string): string {
    const [year, mon] = month.split('-').map(Number);

    return `${MONTHS_ID[(mon ?? 1) - 1]} ${year}`;
}

export default function MoneyReportIndex({ month, companyName, summary, transactions, tsv, sheetsWebhookUrl, sheetsResult }: Props) {
    const [webhookUrl, setWebhookUrl] = React.useState(sheetsWebhookUrl);

    React.useEffect(() => {
        if (sheetsResult) {
            if (sheetsResult.ok) {
                toast.success(sheetsResult.message);
            } else {
                toast.error(sheetsResult.message);
            }
        }
    }, [sheetsResult]);

    function changeMonth(value: string) {
        router.get('/money/report', { month: value }, { preserveState: true });
    }

    async function copyText(text: string, successMessage: string) {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(successMessage);
        } catch {
            toast.error('Gagal menyalin — clipboard tidak tersedia di konteks ini.');
        }
    }

    function whatsappSummary(): string {
        const topExpenses = summary.by_category
            .filter((c) => c.kind === 'expense')
            .slice(0, 3);

        const lines = [
            `*Laporan Keuangan ${monthLabel(month)} — ${companyName}*`,
            `Pemasukan: Rp ${formatRupiah(summary.total_income)}`,
            `Pengeluaran: Rp ${formatRupiah(summary.total_expense)}`,
            `Sisa: Rp ${formatRupiah(summary.net)}`,
            `Saldo akhir: Rp ${formatRupiah(summary.closing_balance)}`,
        ];

        if (topExpenses.length > 0) {
            lines.push('', 'Pengeluaran terbesar:');
            topExpenses.forEach((c, i) => lines.push(`${i + 1}. ${c.name} — Rp ${formatRupiah(c.total)}`));
        }

        return lines.join('\n');
    }

    function saveSheetsSettings(e: React.FormEvent) {
        e.preventDefault();
        router.put('/money/report/sheets-settings', { webhook_url: webhookUrl || null, month }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan Google Sheets tersimpan'),
        });
    }

    const incomeByCategory = summary.by_category.filter((c) => c.kind === 'income');
    const expenseByCategory = summary.by_category.filter((c) => c.kind === 'expense');

    return (
        <AppLayout>
            <PageHeader title="Laporan Bulanan" description="Sheet keuangan siap cetak, ekspor, dan kirim ke Google Sheets." />
            <MoneyNav />

            <div className="mt-6 flex flex-wrap items-end gap-3 print:hidden">
                <div className="space-y-1.5">
                    <Label>Bulan</Label>
                    <Input type="month" value={month} onChange={(e) => changeMonth(e.target.value)} className="w-44" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => window.print()}>Cetak</Button>
                    <Button variant="outline" asChild>
                        <a href={`/money/report/export.csv?month=${month}`}>Export CSV</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`/money/report/export.xlsx?month=${month}`}>Export XLSX</a>
                    </Button>
                    <Button variant="outline" onClick={() => copyText(tsv, 'Data tersalin — tempel langsung di Google Sheets.')}>
                        Salin untuk Sheets
                    </Button>
                    <Button variant="outline" onClick={() => copyText(whatsappSummary(), 'Ringkasan tersalin — siap tempel ke WhatsApp.')}>
                        Salin ringkasan WA
                    </Button>
                </div>
            </div>

            <div className="print-area mt-6 rounded-xl border border-border bg-card px-8 py-7 print:rounded-none print:border-none">
                <div className="border-b border-border pb-4">
                    <h2 className="text-lg font-bold text-foreground">{companyName}</h2>
                    <p className="text-sm text-muted-foreground">Laporan Keuangan — {monthLabel(month)}</p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo awal</p>
                        <p className="mt-1 font-mono text-lg font-semibold">Rp {formatRupiah(summary.opening_balance)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total masuk</p>
                        <p className="mt-1 font-mono text-lg font-semibold text-green-600">Rp {formatRupiah(summary.total_income)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total keluar</p>
                        <p className="mt-1 font-mono text-lg font-semibold text-red-600">Rp {formatRupiah(summary.total_expense)}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo akhir</p>
                        <p className="mt-1 font-mono text-lg font-semibold">Rp {formatRupiah(summary.closing_balance)}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Pemasukan per kategori</h3>
                        <Table>
                            <TableBody>
                                {incomeByCategory.map((c) => (
                                    <TableRow key={`in-${c.category_id ?? 'none'}`}>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                {c.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">Rp {formatRupiah(c.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {incomeByCategory.length === 0 && (
                                    <TableRow><TableCell className="text-muted-foreground">Tidak ada pemasukan.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Pengeluaran per kategori</h3>
                        <Table>
                            <TableBody>
                                {expenseByCategory.map((c) => (
                                    <TableRow key={`out-${c.category_id ?? 'none'}`}>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                {c.name}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">Rp {formatRupiah(c.total)}</TableCell>
                                    </TableRow>
                                ))}
                                {expenseByCategory.length === 0 && (
                                    <TableRow><TableCell className="text-muted-foreground">Tidak ada pengeluaran.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <h3 className="mt-6 text-sm font-semibold text-foreground">Semua transaksi {monthLabel(month)}</h3>
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Dompet</TableHead>
                                <TableHead>Catatan</TableHead>
                                <TableHead className="text-right">Masuk</TableHead>
                                <TableHead className="text-right">Keluar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-mono text-sm">{formatIndonesianDate(tx.date)}</TableCell>
                                    <TableCell>{tx.category_name ?? '—'}</TableCell>
                                    <TableCell>{tx.wallet_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{tx.note ?? '—'}</TableCell>
                                    <TableCell className="text-right font-mono text-green-600">
                                        {tx.type === 'income' ? `Rp ${formatRupiah(tx.amount)}` : ''}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-red-600">
                                        {tx.type === 'expense' ? `Rp ${formatRupiah(tx.amount)}` : ''}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">Tidak ada transaksi bulan ini.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-10 flex justify-end print:mt-14">
                    <div className="w-56 text-center">
                        <p className="text-sm text-muted-foreground">Disusun pada {formatIndonesianDate(new Date().toISOString().slice(0, 10))}</p>
                        <div className="mt-16 border-t border-border pt-2">
                            <p className="text-sm font-medium text-foreground">{companyName}</p>
                            <p className="text-xs text-muted-foreground">Tim Keuangan</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4 print:hidden">
                <h2 className="text-sm font-semibold text-foreground">Kirim ke Google Sheets (Apps Script)</h2>
                <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">
                    Buat Google Apps Script Web App yang menerima POST JSON, lalu tempel URL-nya di sini.
                    Tombol kirim akan mengirim semua transaksi bulan terpilih ke Web App tersebut.
                </p>
                <form onSubmit={saveSheetsSettings} className="mt-3 flex max-w-2xl flex-wrap items-end gap-2">
                    <div className="min-w-64 flex-1 space-y-1.5">
                        <Label>URL Web App</Label>
                        <Input
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/…/exec"
                        />
                    </div>
                    <Button type="submit" variant="outline">Simpan URL</Button>
                    <Button
                        type="button"
                        disabled={!sheetsWebhookUrl}
                        onClick={() => router.post('/money/report/send-sheets', { month }, { preserveScroll: true })}
                    >
                        Kirim ke Google Sheets
                    </Button>
                </form>
                {!sheetsWebhookUrl && (
                    <p className="mt-2 text-[13px] text-muted-foreground">URL belum diatur — tombol kirim nonaktif.</p>
                )}
            </div>
        </AppLayout>
    );
}
