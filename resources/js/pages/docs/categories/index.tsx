import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    documents_count: number;
}

export default function DocCategoriesIndex({ categories }: { categories: CategoryRow[] }) {
    const [name, setName] = useState('');

    function submit(e: FormEvent) {
        e.preventDefault();
        router.post('/doc-categories', { name }, { onSuccess: () => setName('') });
    }

    return (
        <AppLayout>
            <PageHeader title="Kategori Dokumentasi" />
            <form onSubmit={submit} className="mt-4 flex max-w-md gap-2">
                <Input placeholder="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} />
                <Button type="submit">Tambah</Button>
            </form>
            <div className="mt-4 rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Jumlah Dokumen</TableHead>
                            <TableHead className="w-24" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-muted-foreground">{category.documents_count}</TableCell>
                                <TableCell className="text-right">
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
                                                    {category.documents_count > 0
                                                        ? `${category.documents_count} dokumen di kategori ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
                                                        : 'Tindakan ini tidak bisa dibatalkan.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => router.delete(`/doc-categories/${category.id}`)}>
                                                    Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
