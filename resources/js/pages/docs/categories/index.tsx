import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Jumlah Dokumen</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{category.documents_count}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => router.delete(`/doc-categories/${category.id}`)}
                                >
                                    Hapus
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppLayout>
    );
}
