import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const FIELD_LABELS: Record<'name' | 'email' | 'phone' | 'address' | 'npwp', string> = {
    name: 'Nama',
    email: 'Email',
    phone: 'Telepon',
    address: 'Alamat',
    npwp: 'NPWP',
};

export default function CreateClient() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', phone: '', address: '', npwp: '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/clients');
    }

    return (
        <AppLayout>
            <PageHeader title="Tambah Client" />
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
