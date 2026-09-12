import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/status-badge';
import { RowActionsMenu } from '@/components/app/row-actions-menu';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'staff';
    is_active: boolean;
}

export default function UsersIndex({ users }: { users: UserRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Users"
                action={
                    <Button asChild>
                        <Link href="/users/create">Tambah User</Link>
                    </Button>
                }
            />
            <div className="mt-4 rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell className="capitalize">{user.role}</TableCell>
                                <TableCell>
                                    <StatusBadge tone={user.is_active ? 'success' : 'neutral'}>
                                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                                    </StatusBadge>
                                </TableCell>
                                <TableCell>
                                    <RowActionsMenu
                                        editHref={`/users/${user.id}/edit`}
                                        onConfirm={user.is_active ? () => router.delete(`/users/${user.id}`) : undefined}
                                        confirmLabel="Nonaktifkan"
                                        confirmTitle={`Nonaktifkan ${user.name}?`}
                                        confirmDescription="User tidak bisa login lagi sampai diaktifkan ulang oleh admin."
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
