import * as React from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah } from '@/lib/format';
import { parseAmountInput } from '@/lib/parse-amount';

interface BudgetCategory {
    id: number;
    name: string;
    color: string;
    budget: number | null;
    spent: number;
    percent: number | null;
}

interface RecurringRow {
    id: number;
    name: string;
    wallet_name: string | null;
    category_name: string | null;
    type: 'income' | 'expense';
    amount: number;
    day_of_month: number;
    is_active: boolean;
    last_generated_month: string | null;
}

interface Option {
    id: number;
    name: string;
}

interface CategoryOption extends Option {
    kind: 'income' | 'expense';
    color: string;
}

interface Props {
    month: string;
    categories: BudgetCategory[];
    recurring: RecurringRow[];
    wallets: Option[];
    allCategories: CategoryOption[];
    generatedCount: number | null;
}

export default function MoneyBudgetsIndex({ month, categories, recurring, wallets, allCategories, generatedCount }: Props) {
    const [amounts, setAmounts] = React.useState<Record<number, string>>(() =>
        Object.fromEntries(categories.map((c) => [c.id, c.budget !== null ? String(c.budget) : ''])),
    );

    React.useEffect(() => {
        if (generatedCount !== null && generatedCount !== undefined) {
            toast.success(
                generatedCount > 0
                    ? `${generatedCount} transaksi rutin dibuat untuk bulan ini.`
                    : 'Tidak ada transaksi rutin baru — semua sudah dibuat bulan ini.',
            );
        }
    }, [generatedCount]);

    function changeMonth(value: string) {
        router.get('/money/budgets', { month: value }, { preserveState: true });
    }

    function saveBudgets(e: React.FormEvent) {
        e.preventDefault();
        const rows = categories.map((c) => {
            const raw = (amounts[c.id] ?? '').trim();
            return { category_id: c.id, amount: raw === '' ? null : parseAmountInput(raw) };
        });
        if (rows.some((r) => r.amount === null && (amounts[r.category_id] ?? '').trim() !== '')) {
            toast.error('Ada nominal anggaran yang formatnya tidak dikenal.');
            return;
        }
        router.post('/money/budgets', { month, budgets: rows }, {
            onSuccess: () => toast.success('Anggaran tersimpan'),
        });
    }

    // recurring form
    const [rName, setRName] = React.useState('');
    const [rWallet, setRWallet] = React.useState(wallets[0] ? String(wallets[0].id) : '');
    const [rCategory, setRCategory] = React.useState('none');
    const [rType, setRType] = React.useState<'income' | 'expense'>('expense');
    const [rAmount, setRAmount] = React.useState('');
    const [rDay, setRDay] = React.useState('1');

    function addRecurring(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseAmountInput(rAmount);
        if (parsed === null || parsed <= 0) {
            toast.error('Nominal transaksi rutin belum valid.');
            return;
        }
        router.post('/money/budgets/recurring', {
            name: rName,
            wallet_id: Number(rWallet),
            category_id: rCategory === 'none' ? null : Number(rCategory),
            type: rType,
            amount: parsed,
            day_of_month: Number(rDay),
        }, { onSuccess: () => { setRName(''); setRAmount(''); toast.success('Aturan rutin ditambahkan'); } });
    }

    return (
        <AppLayout>
            <PageHeader title="Anggaran" description="Batas pengeluaran per kategori, per bulan." />
            <MoneyNav />

            <div className="mt-6 flex items-end gap-3">
                <div className="space-y-1.5">
                    <Label>Bulan</Label>
                    <Input type="month" value={month} onChange={(e) => changeMonth(e.target.value)} className="w-44" />
                </div>
            </div>

            <form onSubmit={saveBudgets} className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Anggaran (Rp)</TableHead>
                            <TableHead className="text-right">Realisasi</TableHead>
                            <TableHead className="w-56">Kemajuan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => {
                            const percent = category.percent ?? 0;
                            const barClass = category.percent === null
                                ? 'bg-muted'
                                : percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-orange-500' : 'bg-primary';

                            return (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        <span className="inline-flex items-center gap-2 font-medium">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                                            {category.name}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={amounts[category.id] ?? ''}
                                            onChange={(e) => setAmounts((prev) => ({ ...prev, [category.id]: e.target.value }))}
                                            placeholder="cth. 2jt (kosong = tanpa anggaran)"
                                            className="w-56"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-mono">Rp {formatRupiah(category.spent)}</TableCell>
                                    <TableCell>
                                        {category.percent === null ? (
                                            <span className="text-sm text-muted-foreground">Tanpa anggaran</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, percent)}%` }} />
                                                </div>
                                                <span className="font-mono text-xs text-muted-foreground">{percent}%</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <div className="border-t border-border p-3">
                    <Button type="submit">Simpan anggaran</Button>
                </div>
            </form>

            <div className="mt-8 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Transaksi rutin</h2>
                    <p className="text-sm text-muted-foreground">Tagihan dan pemasukan berulang tiap bulan, dibuat otomatis saat tombol ditekan.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.post('/money/budgets/generate-recurring', {}, { preserveScroll: true })}
                >
                    Generate bulan ini
                </Button>
            </div>

            <form onSubmit={addRecurring} className="mt-4 rounded-xl border border-border bg-card px-5 py-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-44 flex-1 space-y-1.5">
                        <Label>Nama</Label>
                        <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="VPS bulanan" required />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Tipe</Label>
                        <Select value={rType} onValueChange={(v) => setRType(v as 'income' | 'expense')}>
                            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Pengeluaran</SelectItem>
                                <SelectItem value="income">Pemasukan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Dompet</Label>
                        <Select value={rWallet} onValueChange={setRWallet}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                            <SelectContent>
                                {wallets.map((w) => (
                                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Kategori</Label>
                        <Select value={rCategory} onValueChange={setRCategory}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Tanpa kategori" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tanpa kategori</SelectItem>
                                {allCategories.filter((c) => c.kind === rType).map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Nominal</Label>
                        <Input value={rAmount} onChange={(e) => setRAmount(e.target.value)} placeholder="350rb" className="w-32" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Tanggal (1–28)</Label>
                        <Input type="number" min={1} max={28} value={rDay} onChange={(e) => setRDay(e.target.value)} className="w-24" />
                    </div>
                    <Button type="submit">Tambah aturan</Button>
                </div>
            </form>

            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Dompet</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Terakhir dibuat</TableHead>
                            <TableHead className="w-20" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recurring.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-medium">{rule.name}</TableCell>
                                <TableCell>{rule.wallet_name}</TableCell>
                                <TableCell>{rule.category_name ?? '—'}</TableCell>
                                <TableCell className={`text-right font-mono ${rule.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {rule.type === 'income' ? '+' : '−'} Rp {formatRupiah(rule.amount)}
                                </TableCell>
                                <TableCell className="font-mono text-sm">tgl {rule.day_of_month}</TableCell>
                                <TableCell className="text-muted-foreground">{rule.last_generated_month ?? '—'}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => router.delete(`/money/budgets/recurring/${rule.id}`)}
                                    >
                                        Hapus
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {recurring.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Belum ada aturan transaksi rutin.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
