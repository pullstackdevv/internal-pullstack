import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah } from '@/lib/format';
import { formatAmountPreview, parseAmountInput } from '@/lib/parse-amount';

export interface WalletOption {
    id: number;
    name: string;
}

export interface CategoryOption {
    id: number;
    name: string;
    kind: 'income' | 'expense';
    color: string;
}

export interface InvoiceOption {
    id: number;
    number: string;
    client_name: string;
    status: string;
    total: number;
}

export interface TransactionDefaults {
    wallet_id: number;
    category_id: number | null;
    type: 'income' | 'expense';
    amount: number;
    date: string;
    note: string;
    invoice_id: number | null;
}

interface Props {
    wallets: WalletOption[];
    categories: CategoryOption[];
    invoices: InvoiceOption[];
    defaults: TransactionDefaults;
    submitUrl: string;
    submitLabel: string;
    method?: 'post' | 'put';
}

export function MoneyTransactionForm({ wallets, categories, invoices, defaults, submitUrl, submitLabel, method = 'post' }: Props) {
    const { data, setData, post, put, processing, errors, transform } = useForm({
        wallet_id: defaults.wallet_id,
        category_id: defaults.category_id ? String(defaults.category_id) : 'none',
        type: defaults.type,
        amount: defaults.amount ? String(defaults.amount) : '',
        date: defaults.date,
        note: defaults.note,
        invoice_id: defaults.invoice_id ? String(defaults.invoice_id) : 'none',
        mark_paid: false,
    });

    const visibleCategories = categories.filter((c) => c.kind === data.type);
    const preview = formatAmountPreview(data.amount);

    function submit(e: FormEvent) {
        e.preventDefault();

        const parsed = parseAmountInput(data.amount);
        if (parsed === null || parsed <= 0) {
            toast.error('Nominal belum valid — contoh format: 150rb, 1,5jt, atau 150000.');
            return;
        }

        transform((current) => ({
            wallet_id: Number(current.wallet_id),
            category_id: current.category_id === 'none' ? null : Number(current.category_id),
            type: current.type,
            amount: parsed,
            date: current.date,
            note: current.note || null,
            invoice_id: current.type === 'income' && current.invoice_id !== 'none' ? Number(current.invoice_id) : null,
            mark_paid: current.type === 'income' && current.invoice_id !== 'none' ? current.mark_paid : false,
        }));

        if (method === 'put') {
            put(submitUrl);
        } else {
            post(submitUrl);
        }
    }

    return (
        <form onSubmit={submit} className="mt-6 max-w-3xl">
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle>Detail Transaksi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Tipe</Label>
                        <div className="flex overflow-hidden rounded-md border border-border w-fit">
                            <button
                                type="button"
                                onClick={() => { setData('type', 'expense'); setData('category_id', 'none'); }}
                                className={`px-4 py-2 text-sm ${data.type === 'expense' ? 'bg-red-600 font-medium text-white' : 'bg-card text-muted-foreground'}`}
                            >
                                Pengeluaran
                            </button>
                            <button
                                type="button"
                                onClick={() => { setData('type', 'income'); setData('category_id', 'none'); }}
                                className={`px-4 py-2 text-sm ${data.type === 'income' ? 'bg-green-600 font-medium text-white' : 'bg-card text-muted-foreground'}`}
                            >
                                Pemasukan
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Dompet</Label>
                            <Select value={String(data.wallet_id)} onValueChange={(v) => setData('wallet_id', Number(v))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Pilih dompet" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.map((w) => (
                                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.wallet_id && <p className="text-sm text-destructive">{errors.wallet_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Tanpa kategori" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tanpa kategori</SelectItem>
                                    {visibleCategories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Nominal (Rp)</Label>
                            <Input
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                placeholder="150rb / 1,5jt / 150000"
                                inputMode="numeric"
                            />
                            <p className={`text-xs ${data.amount && !preview ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {data.amount ? (preview ?? 'Format belum dikenal') : 'Bisa ditulis singkat: 150rb = Rp 150.000'}
                            </p>
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Tanggal</Label>
                            <Input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
                            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Catatan</Label>
                        <Input value={data.note} onChange={(e) => setData('note', e.target.value)} placeholder="Opsional" />
                        {errors.note && <p className="text-sm text-destructive">{errors.note}</p>}
                    </div>

                    {data.type === 'income' && (
                        <div className="space-y-3 rounded-lg border border-border p-4">
                            <div className="space-y-2">
                                <Label>Invoice terkait (opsional)</Label>
                                <Select value={data.invoice_id} onValueChange={(v) => setData('invoice_id', v)}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Tidak terkait invoice" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tidak terkait invoice</SelectItem>
                                        {invoices.map((invoice) => (
                                            <SelectItem key={invoice.id} value={String(invoice.id)}>
                                                {invoice.number} — {invoice.client_name} — Rp {formatRupiah(invoice.total)} ({invoice.status === 'paid' ? 'Lunas' : 'Belum bayar'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {data.invoice_id !== 'none' && (
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={data.mark_paid}
                                        onCheckedChange={(checked) => setData('mark_paid', checked === true)}
                                    />
                                    Tandai invoice ini lunas saat disimpan
                                </label>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={processing || wallets.length === 0}>{submitLabel}</Button>
                    {wallets.length === 0 && (
                        <p className="ml-3 text-sm text-destructive">Belum ada dompet aktif — buat dompet dulu.</p>
                    )}
                </CardFooter>
            </Card>
        </form>
    );
}
