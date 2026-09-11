import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ClientRow {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
}

export default function ClientsIndex({ clients }: { clients: ClientRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Client"
                action={<Button asChild><Link href="/clients/create">Tambah Client</Link></Button>}
            />
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell>{client.name}</TableCell>
                            <TableCell>{client.email ?? '-'}</TableCell>
                            <TableCell>{client.phone ?? '-'}</TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/clients/${client.id}/edit`}>Edit</Link>
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => router.delete(`/clients/${client.id}`)}
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
