import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
            <form onSubmit={submit} className="mt-4 max-w-lg space-y-4">
                {(['name', 'email', 'phone', 'address', 'npwp'] as const).map((field) => (
                    <div key={field} className="space-y-2">
                        <Label htmlFor={field} className="capitalize">{field}</Label>
                        <Input
                            id={field}
                            value={data[field]}
                            onChange={(e) => setData(field, e.target.value)}
                        />
                        {errors[field] && <p className="text-sm text-destructive">{errors[field]}</p>}
                    </div>
                ))}
                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
