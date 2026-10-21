import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { RowActionsMenu } from '@/components/app/row-actions-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatIndonesianDate, formatRupiah } from '@/lib/format';
import { formatAmountPreview, parseAmountInput } from '@/lib/parse-amount';

interface TxRow {
    id: number;
    date: string;
    type: 'income' | 'expense';
    amount: number;
    note: string | null;
    wallet_id: number;
    wallet_name: string | null;
    category_id: number | null;
    category_name: string | null;
    category_color: string | null;
    invoice_id: number | null;
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
    transactions: TxRow[];
    wallets: Option[];
    categories: CategoryOption[];
}

const columns: ColumnDef<TxRow>[] = [
    {
        accessorKey: 'date',
        header: 'Tanggal',
        cell: ({ row }) => <span className="font-mono text-sm">{formatIndonesianDate(row.original.date)}</span>,
        sortingFn: (a, b) => a.original.date.localeCompare(b.original.date),
    },
    {
        accessorKey: 'category_name',
        header: 'Kategori',
        cell: ({ row }) =>
            row.original.category_name ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.original.category_color ?? '#64748b' }} />
                    {row.original.category_name}
                </span>
            ) : (
                <span className="text-muted-foreground">—</span>
            ),
    },
    {
        accessorKey: 'wallet_name',
        header: 'Dompet',
        cell: ({ row }) => <span>{row.original.wallet_name}</span>,
    },
    {
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.note ?? '—'}</span>,
    },
    {
        accessorKey: 'amount',
        header: () => <div className="text-right">Nominal</div>,
        cell: ({ row }) => (
            <div className={`text-right font-mono ${row.original.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {row.original.type === 'income' ? '+' : '−'} Rp {formatRupiah(row.original.amount)}
            </div>
        ),
        sortingFn: (a, b) => a.original.amount - b.original.amount,
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
            <div className="flex justify-end">
                <RowActionsMenu
                    editHref={`/money/transactions/${row.original.id}/edit`}
                    onConfirm={() => router.delete(`/money/transactions/${row.original.id}`)}
                    confirmTitle="Hapus transaksi ini?"
                    confirmDescription="Saldo dompet akan berubah mengikuti penghapusan ini."
                />
            </div>
        ),
    },
];

export default function MoneyTransactionsIndex({ transactions, wallets, categories }: Props) {
    // ---- filters ----
    const [month, setMonth] = React.useState('');
    const [walletFilter, setWalletFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [query, setQuery] = React.useState('');

    const filtered = React.useMemo(
        () =>
            transactions.filter((tx) => {
                if (month && !tx.date.startsWith(month)) return false;
                if (walletFilter !== 'all' && tx.wallet_id !== Number(walletFilter)) return false;
                if (categoryFilter !== 'all' && tx.category_id !== Number(categoryFilter)) return false;
                if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
                if (query && !(tx.note ?? '').toLowerCase().includes(query.toLowerCase())) return false;
                return true;
            }),
        [transactions, month, walletFilter, categoryFilter, typeFilter, query],
    );

    const filteredNet = filtered.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    // ---- quick add ----
    const today = new Date().toISOString().slice(0, 10);
    const [qaDate, setQaDate] = React.useState(today);
    const [qaType, setQaType] = React.useState<'income' | 'expense'>('expense');
    const [qaAmount, setQaAmount] = React.useState('');
    const [qaWallet, setQaWallet] = React.useState(wallets[0] ? String(wallets[0].id) : '');
    const [qaCategory, setQaCategory] = React.useState('');
    const [qaNote, setQaNote] = React.useState('');

    const qaCategories = categories.filter((c) => c.kind === qaType);
    const qaPreview = formatAmountPreview(qaAmount);
    const qaParsed = parseAmountInput(qaAmount);

    function quickAdd(e: React.FormEvent) {
        e.preventDefault();
        if (qaParsed === null || qaParsed <= 0) {
            toast.error('Nominal belum valid — contoh format: 150rb, 1,5jt, atau 150000.');
            return;
        }
        router.post(
            '/money/transactions',
            {
                wallet_id: Number(qaWallet),
                category_id: qaCategory ? Number(qaCategory) : null,
                type: qaType,
                amount: qaParsed,
                date: qaDate,
                note: qaNote || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setQaAmount('');
                    setQaNote('');
                    toast.success('Transaksi tercatat');
                },
            },
        );
    }

    // ---- table ----
    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }]);
    const table = useReactTable({
        data: filtered,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
        initialState: { pagination: { pageSize: 15 } },
    });

    return (
        <AppLayout>
            <PageHeader
                title="Transaksi"
                description="Semua pemasukan dan pengeluaran."
                action={
                    <Button asChild>
                        <Link href="/money/transactions/create">Form lengkap</Link>
                    </Button>
                }
            />

            <form onSubmit={quickAdd} className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <Label>Tanggal</Label>
                        <Input type="date" value={qaDate} onChange={(e) => setQaDate(e.target.value)} className="w-40" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Tipe</Label>
                        <div className="flex overflow-hidden rounded-md border border-border">
                            <button
                                type="button"
                                onClick={() => { setQaType('expense'); setQaCategory(''); }}
                                className={`px-3 py-2 text-sm ${qaType === 'expense' ? 'bg-red-600 font-medium text-white' : 'bg-card text-muted-foreground'}`}
                            >
                                Keluar
                            </button>
                            <button
                                type="button"
                                onClick={() => { setQaType('income'); setQaCategory(''); }}
                                className={`px-3 py-2 text-sm ${qaType === 'income' ? 'bg-green-600 font-medium text-white' : 'bg-card text-muted-foreground'}`}
                            >
                                Masuk
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Nominal</Label>
                        <Input
                            value={qaAmount}
                            onChange={(e) => setQaAmount(e.target.value)}
                            placeholder="150rb / 1,5jt / 150000"
                            className="w-44"
                        />
                        <p className={`text-xs ${qaAmount && !qaPreview ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {qaAmount ? (qaPreview ?? 'Format belum dikenal') : 'Pratinjau muncul di sini'}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Dompet</Label>
                        <Select value={qaWallet} onValueChange={setQaWallet}>
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
                        <Select value={qaCategory || 'none'} onValueChange={(v) => setQaCategory(v === 'none' ? '' : v)}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="Tanpa kategori" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tanpa kategori</SelectItem>
                                {qaCategories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="min-w-44 flex-1 space-y-1.5">
                        <Label>Catatan</Label>
                        <Input value={qaNote} onChange={(e) => setQaNote(e.target.value)} placeholder="Opsional" />
                    </div>
                    <Button type="submit" disabled={wallets.length === 0}>Tambah cepat</Button>
                </div>
                {wallets.length === 0 && (
                    <p className="mt-2 text-sm text-destructive">Belum ada dompet aktif — buat dompet dulu di halaman Dompet.</p>
                )}
            </form>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
                    <InputGroup className="max-w-xs">
                        <InputGroupInput placeholder="Cari catatan..." value={query} onChange={(e) => setQuery(e.target.value)} />
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                    </InputGroup>
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua tipe</SelectItem>
                            <SelectItem value="income">Pemasukan</SelectItem>
                            <SelectItem value="expense">Pengeluaran</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={walletFilter} onValueChange={setWalletFilter}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua dompet</SelectItem>
                            {wallets.map((w) => (
                                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua kategori</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    Tidak ada transaksi yang cocok dengan filter.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-border p-3">
                    <p className="text-sm text-muted-foreground">
                        {filtered.length} transaksi · bersih{' '}
                        <span className={`font-mono ${filteredNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {filteredNet >= 0 ? '+' : '−'} Rp {formatRupiah(Math.abs(filteredNet))}
                        </span>
                    </p>
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Sebelumnya
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Berikutnya
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
