import * as React from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import { RowActionsMenu } from '@/components/app/row-actions-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatRupiah } from '@/lib/format';
import { formatAmountPreview, parseAmountInput } from '@/lib/parse-amount';

interface WalletRow {
    id: number;
    name: string;
    type: string;
    opening_balance: number;
    balance: number;
    transactions_count: number;
    is_active: boolean;
}

const TYPE_OPTIONS = [
    { value: 'cash', label: 'Tunai' },
    { value: 'bank', label: 'Bank' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'other', label: 'Lainnya' },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));

export default function MoneyWalletsIndex({ wallets }: { wallets: WalletRow[] }) {
    // create
    const [name, setName] = React.useState('');
    const [type, setType] = React.useState('bank');
    const [opening, setOpening] = React.useState('');

    function createWallet(e: React.FormEvent) {
        e.preventDefault();
        const parsed = opening ? parseAmountInput(opening) : 0;
        if (parsed === null) {
            toast.error('Saldo awal belum valid.');
            return;
        }
        router.post('/money/wallets', { name, type, opening_balance: parsed }, {
            onSuccess: () => { setName(''); setOpening(''); toast.success('Dompet dibuat'); },
        });
    }

    // edit dialog
    const [editing, setEditing] = React.useState<WalletRow | null>(null);
    const [editName, setEditName] = React.useState('');
    const [editType, setEditType] = React.useState('bank');
    const [editOpening, setEditOpening] = React.useState('');
    const [editActive, setEditActive] = React.useState(true);

    function openEdit(wallet: WalletRow) {
        setEditing(wallet);
        setEditName(wallet.name);
        setEditType(wallet.type);
        setEditOpening(String(wallet.opening_balance));
        setEditActive(wallet.is_active);
    }

    function saveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        const parsed = parseAmountInput(editOpening);
        if (parsed === null) {
            toast.error('Saldo awal belum valid.');
            return;
        }
        router.put(`/money/wallets/${editing.id}`, {
            name: editName, type: editType, opening_balance: parsed, is_active: editActive,
        }, { onSuccess: () => { setEditing(null); toast.success('Dompet diperbarui'); } });
    }

    // transfer
    const today = new Date().toISOString().slice(0, 10);
    const [fromId, setFromId] = React.useState('');
    const [toId, setToId] = React.useState('');
    const [transferAmount, setTransferAmount] = React.useState('');
    const [transferDate, setTransferDate] = React.useState(today);
    const [transferNote, setTransferNote] = React.useState('');
    const transferPreview = formatAmountPreview(transferAmount);

    function submitTransfer(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseAmountInput(transferAmount);
        if (parsed === null || parsed <= 0) {
            toast.error('Nominal transfer belum valid.');
            return;
        }
        if (!fromId || !toId || fromId === toId) {
            toast.error('Pilih dompet asal dan tujuan yang berbeda.');
            return;
        }
        router.post('/money/wallets/transfer', {
            from_wallet_id: Number(fromId),
            to_wallet_id: Number(toId),
            amount: parsed,
            date: transferDate,
            note: transferNote || null,
        }, { onSuccess: () => { setTransferAmount(''); setTransferNote(''); toast.success('Transfer tercatat'); } });
    }

    return (
        <AppLayout>
            <PageHeader title="Dompet" description="Rekening dan tempat menyimpan uang, beserta saldonya." />
            <MoneyNav />

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
                <form onSubmit={createWallet} className="rounded-xl border border-border bg-card px-5 py-4">
                    <h2 className="text-sm font-semibold text-foreground">Dompet baru</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label>Nama</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="BCA Utama" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jenis</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Saldo awal</Label>
                            <Input value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0" />
                        </div>
                    </div>
                    <Button type="submit" className="mt-4">Tambah dompet</Button>
                </form>

                <form onSubmit={submitTransfer} className="rounded-xl border border-border bg-card px-5 py-4">
                    <h2 className="text-sm font-semibold text-foreground">Transfer antar dompet</h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">Saldo total tidak berubah — hanya berpindah dompet.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Dari</Label>
                            <Select value={fromId} onValueChange={setFromId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Dompet asal" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.filter((w) => w.is_active).map((w) => (
                                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Ke</Label>
                            <Select value={toId} onValueChange={setToId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Dompet tujuan" /></SelectTrigger>
                                <SelectContent>
                                    {wallets.filter((w) => w.is_active).map((w) => (
                                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Nominal</Label>
                            <Input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="500rb" />
                            {transferPreview && <p className="text-xs text-muted-foreground">{transferPreview}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tanggal</Label>
                            <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                        </div>
                    </div>
                    <Button type="submit" variant="outline" className="mt-4">Transfer</Button>
                </form>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead className="text-right">Saldo awal</TableHead>
                            <TableHead className="text-right">Saldo sekarang</TableHead>
                            <TableHead>Transaksi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wallets.map((wallet) => (
                            <TableRow key={wallet.id}>
                                <TableCell className="font-medium">{wallet.name}</TableCell>
                                <TableCell>{TYPE_LABELS[wallet.type] ?? wallet.type}</TableCell>
                                <TableCell className="text-right font-mono">Rp {formatRupiah(wallet.opening_balance)}</TableCell>
                                <TableCell className="text-right font-mono font-semibold">Rp {formatRupiah(wallet.balance)}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">{wallet.transactions_count}</TableCell>
                                <TableCell>{wallet.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(wallet)}>
                                            Edit
                                        </Button>
                                        <RowActionsMenu
                                            onConfirm={() => router.delete(`/money/wallets/${wallet.id}`)}
                                            confirmTitle={`Hapus dompet ${wallet.name}?`}
                                            confirmDescription="Dompet yang masih punya transaksi tidak bisa dihapus."
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {wallets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Belum ada dompet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <form onSubmit={saveEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit dompet</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nama</Label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis</Label>
                                <Select value={editType} onValueChange={setEditType}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TYPE_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Saldo awal</Label>
                                <Input value={editOpening} onChange={(e) => setEditOpening(e.target.value)} />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={editActive} onCheckedChange={(c) => setEditActive(c === true)} />
                                Aktif
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
