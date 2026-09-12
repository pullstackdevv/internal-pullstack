import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RowActionsMenu } from '@/components/app/row-actions-menu';

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
            <div className="mt-4 rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telepon</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell className="text-muted-foreground">{client.email ?? '-'}</TableCell>
                                <TableCell className="text-muted-foreground">{client.phone ?? '-'}</TableCell>
                                <TableCell>
                                    <RowActionsMenu
                                        editHref={`/clients/${client.id}/edit`}
                                        onConfirm={() => router.delete(`/clients/${client.id}`)}
                                        confirmTitle={`Hapus ${client.name}?`}
                                        confirmDescription="Invoice yang sudah dibuat untuk client ini tetap tersimpan seperti apa adanya."
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
