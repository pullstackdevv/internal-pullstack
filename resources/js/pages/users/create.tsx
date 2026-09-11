import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleAccessFields, ModuleAccessEntry } from '@/components/app/module-access-fields';

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        role: 'admin' | 'staff';
        module_access: ModuleAccessEntry[];
    }>({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        module_access: [],
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/users');
    }

    return (
        <AppLayout>
            <PageHeader title="Tambah User" />
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={data.role} onValueChange={(v) => setData('role', v as 'admin' | 'staff')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {data.role === 'staff' && (
                    <ModuleAccessFields value={data.module_access} onChange={(v) => setData('module_access', v)} />
                )}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
