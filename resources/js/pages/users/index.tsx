import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>
                                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                </Badge>
                            </TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/users/${user.id}/edit`}>Edit</Link>
                                </Button>
                                {user.is_active && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => router.delete(`/users/${user.id}`)}
                                    >
                                        Nonaktifkan
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppLayout>
    );
}
