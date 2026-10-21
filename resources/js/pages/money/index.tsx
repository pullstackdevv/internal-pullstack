import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatIndonesianDate, formatRupiah } from '@/lib/format';

interface WalletCard {
    id: number;
    name: string;
    type: string;
    balance: number;
    transactions_count: number;
    is_active: boolean;
}

interface BudgetRow {
    category_id: number;
    name: string;
    color: string;
    budget: number | null;
    spent: number;
    remaining: number | null;
    percent: number | null;
}

interface RecentTx {
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
    totalBalance: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    wallets: WalletCard[];
    series: Array<{ month: string; label: string; income: number; expense: number }>;
    budgets: BudgetRow[];
    recentTransactions: RecentTx[];
}

const WALLET_TYPE_LABELS: Record<string, string> = {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    other: 'Lainnya',
};

function StatCell({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass: string }) {
    return (
        <div className="flex-1 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-1.5 text-[28px] font-bold leading-none ${valueClass}`}>{value}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{sub}</p>
        </div>
    );
}

export default function MoneyDashboard({
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet,
    wallets,
    series,
    budgets,
    recentTransactions,
}: Props) {
    const maxSeries = Math.max(1, ...series.flatMap((s) => [s.income, s.expense]));

    return (
        <AppLayout>
            <PageHeader
                title="Keuangan"
                description="Pantau pemasukan, pengeluaran, dan sisa saldo Pullstack."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/money/report">Laporan bulanan</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/money/transactions">Catat transaksi</Link>
                        </Button>
                    </div>
                }
            />
            <MoneyNav />

            <div className="mt-6 flex flex-col divide-y divide-border rounded-xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
                <StatCell label="Saldo total" value={`Rp ${formatRupiah(totalBalance)}`} sub="Semua dompet" valueClass="text-foreground" />
                <StatCell label="Pemasukan bulan ini" value={`Rp ${formatRupiah(monthIncome)}`} sub="Uang masuk bulan berjalan" valueClass="text-green-600" />
                <StatCell label="Pengeluaran bulan ini" value={`Rp ${formatRupiah(monthExpense)}`} sub="Uang keluar bulan berjalan" valueClass="text-red-600" />
                <StatCell label="Sisa bulan ini" value={`Rp ${formatRupiah(monthNet)}`} sub="Pemasukan dikurangi pengeluaran" valueClass="text-blue-600" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wallets.map((wallet) => (
                    <div key={wallet.id} className="rounded-xl border border-border bg-card px-5 py-4">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{wallet.name}</p>
                            <span className="text-xs text-muted-foreground">{WALLET_TYPE_LABELS[wallet.type] ?? wallet.type}</span>
                        </div>
                        <p className="mt-2 font-mono text-xl font-semibold text-foreground">Rp {formatRupiah(wallet.balance)}</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                            {wallet.transactions_count} transaksi{wallet.is_active ? '' : ' · nonaktif'}
                        </p>
                    </div>
                ))}
                {wallets.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                        Belum ada dompet. Buat dompet pertama di halaman Dompet.
                    </div>
                )}
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card px-5 py-4 lg:col-span-2">
                    <h2 className="text-sm font-semibold text-foreground">Arus kas 6 bulan terakhir</h2>
                    <div className="mt-4 flex h-44 items-end gap-3">
                        {series.map((point) => (
                            <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                                <div className="flex h-32 w-full items-end justify-center gap-1">
                                    <div
                                        className="w-3.5 rounded-t bg-green-500"
                                        style={{ height: `${Math.max(2, (point.income / maxSeries) * 100)}%` }}
                                        title={`Pemasukan: Rp ${formatRupiah(point.income)}`}
                                    />
                                    <div
                                        className="w-3.5 rounded-t bg-red-500"
                                        style={{ height: `${Math.max(2, (point.expense / maxSeries) * 100)}%` }}
                                        title={`Pengeluaran: Rp ${formatRupiah(point.expense)}`}
                                    />
                                </div>
                                <span className="text-[11px] text-muted-foreground">{point.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-green-500" /> Pemasukan</span>
                        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-500" /> Pengeluaran</span>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card px-5 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">Anggaran bulan ini</h2>
                        <Link href="/money/budgets" className="text-sm text-primary hover:underline">Atur</Link>
                    </div>
                    <div className="mt-4 space-y-4">
                        {budgets.filter((b) => b.budget !== null).map((budget) => {
                            const percent = budget.percent ?? 0;
                            const barClass = percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-orange-500' : 'bg-primary';

                            return (
                                <div key={budget.category_id}>
                                    <div className="flex items-baseline justify-between text-sm">
                                        <span className="font-medium text-foreground">{budget.name}</span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {formatRupiah(budget.spent)} / {formatRupiah(budget.budget ?? 0)}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                                        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, percent)}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {percent >= 100
                                            ? `Lewat anggaran ${formatRupiah(Math.abs(budget.remaining ?? 0))} (${percent}%)`
                                            : `Terpakai ${percent}% · sisa Rp ${formatRupiah(budget.remaining ?? 0)}`}
                                    </p>
                                </div>
                            );
                        })}
                        {budgets.every((b) => b.budget === null) && (
                            <p className="text-sm text-muted-foreground">
                                Belum ada anggaran bulan ini. Atur di halaman Anggaran.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                    <h2 className="text-sm font-semibold text-foreground">Transaksi terbaru</h2>
                    <Link href="/money/transactions" className="text-sm text-primary hover:underline">Lihat semua</Link>
                </div>
                {recentTransactions.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Dompet</TableHead>
                                <TableHead>Catatan</TableHead>
                                <TableHead className="text-right">Nominal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-mono text-sm">{formatIndonesianDate(tx.date)}</TableCell>
                                    <TableCell>
                                        {tx.category_name ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tx.category_color ?? '#64748b' }} />
                                                {tx.category_name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{tx.wallet_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{tx.note ?? '—'}</TableCell>
                                    <TableCell className={`text-right font-mono ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'income' ? '+' : '−'} Rp {formatRupiah(tx.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="px-5 py-6 text-sm text-muted-foreground">Belum ada transaksi.</p>
                )}
            </div>
        </AppLayout>
    );
}
