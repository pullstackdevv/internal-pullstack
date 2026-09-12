import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientData {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    npwp: string | null;
}

const FIELD_LABELS: Record<'name' | 'email' | 'phone' | 'address' | 'npwp', string> = {
    name: 'Nama',
    email: 'Email',
    phone: 'Telepon',
    address: 'Alamat',
    npwp: 'NPWP',
};

export default function EditClient({ client }: { client: ClientData }) {
    const { data, setData, put, processing, errors } = useForm({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        address: client.address ?? '',
        npwp: client.npwp ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/clients/${client.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit ${client.name}`} />
            <form onSubmit={submit} className="mt-4 max-w-lg">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((field) => (
                            <div key={field} className="space-y-2">
                                <Label htmlFor={field}>{FIELD_LABELS[field]}</Label>
                                <Input
                                    id={field}
                                    value={data[field]}
                                    onChange={(e) => setData(field, e.target.value)}
                                />
                                {errors[field] && <p className="text-sm text-destructive">{errors[field]}</p>}
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={processing}>Simpan</Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}
