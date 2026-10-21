import * as React from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import { StatusBadge } from '@/components/app/status-badge';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CategoryRow {
    id: number;
    name: string;
    kind: 'income' | 'expense';
    color: string;
    is_active: boolean;
    transactions_count: number;
}

export default function MoneyCategoriesIndex({ categories }: { categories: CategoryRow[] }) {
    const [name, setName] = React.useState('');
    const [kind, setKind] = React.useState<'income' | 'expense'>('expense');
    const [color, setColor] = React.useState('#dc2626');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post('/money/categories', { name, kind, color }, {
            onSuccess: () => { setName(''); toast.success('Kategori ditambahkan'); },
        });
    }

    const [editing, setEditing] = React.useState<CategoryRow | null>(null);
    const [editName, setEditName] = React.useState('');
    const [editKind, setEditKind] = React.useState<'income' | 'expense'>('expense');
    const [editColor, setEditColor] = React.useState('#64748b');
    const [editActive, setEditActive] = React.useState(true);

    function openEdit(category: CategoryRow) {
        setEditing(category);
        setEditName(category.name);
        setEditKind(category.kind);
        setEditColor(category.color);
        setEditActive(category.is_active);
    }

    function saveEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!editing) return;
        router.put(`/money/categories/${editing.id}`, {
            name: editName, kind: editKind, color: editColor, is_active: editActive,
        }, { onSuccess: () => { setEditing(null); toast.success('Kategori diperbarui'); } });
    }

    return (
        <AppLayout>
            <PageHeader title="Kategori Keuangan" description="Kelompokkan pemasukan dan pengeluaran." />
            <MoneyNav />

            <form onSubmit={submit} className="mt-6 flex max-w-2xl flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1 space-y-1.5">
                    <Label>Nama kategori</Label>
                    <Input placeholder="cth. Server & VPS" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                    <Label>Jenis</Label>
                    <Select value={kind} onValueChange={(v) => setKind(v as 'income' | 'expense')}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Pengeluaran</SelectItem>
                            <SelectItem value="income">Pemasukan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Warna</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-9 w-12 cursor-pointer rounded-md border border-border bg-card"
                        />
                        <span className="font-mono text-xs text-muted-foreground">{color}</span>
                    </div>
                </div>
                <Button type="submit">Tambah</Button>
            </form>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Jumlah Transaksi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-32" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>
                                    <span className="inline-flex items-center gap-2 font-medium">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                                        {category.name}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge tone={category.kind === 'income' ? 'success' : 'warning'}>
                                        {category.kind === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </StatusBadge>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">{category.transactions_count}</TableCell>
                                <TableCell>{category.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>Edit</Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                    Hapus
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus kategori {category.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Transaksi yang memakai kategori ini tidak ikut terhapus, tapi kategorinya menjadi kosong.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => router.delete(`/money/categories/${category.id}`)}>
                                                        Hapus
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Belum ada kategori.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <form onSubmit={saveEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit kategori</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nama</Label>
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Jenis</Label>
                                <Select value={editKind} onValueChange={(v) => setEditKind(v as 'income' | 'expense')}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="expense">Pengeluaran</SelectItem>
                                        <SelectItem value="income">Pemasukan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Warna</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="h-9 w-12 cursor-pointer rounded-md border border-border bg-card"
                                    />
                                    <span className="font-mono text-xs text-muted-foreground">{editColor}</span>
                                </div>
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
