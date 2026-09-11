import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceItemRows, InvoiceItem } from '@/components/app/invoice-item-rows';
import { currentMonthLabel } from '@/lib/format';

interface ClientOption {
    id: number;
    name: string;
}

export default function CreateInvoice({ clients }: { clients: ClientOption[] }) {
    const defaultMonth = currentMonthLabel();
    const { data, setData, post, processing, errors } = useForm<{
        client_id: number;
        issue_date: string;
        items: InvoiceItem[];
    }>({
        client_id: clients[0]?.id ?? 0,
        issue_date: new Date().toISOString().slice(0, 10),
        items: [{ description: '', month: defaultMonth, amount: 0 }],
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/invoices');
    }

    return (
        <AppLayout>
            <PageHeader title="Invoice Baru" />
            <form onSubmit={submit} className="mt-4 max-w-3xl space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                            value={String(data.client_id)}
                            onValueChange={(v) => setData('client_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.client_id && <p className="text-sm text-destructive">{errors.client_id}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                            type="date"
                            value={data.issue_date}
                            onChange={(e) => setData('issue_date', e.target.value)}
                        />
                    </div>
                </div>

                <InvoiceItemRows
                    items={data.items}
                    onChange={(items) => setData('items', items)}
                    defaultMonth={defaultMonth}
                />
                {errors.items && <p className="text-sm text-destructive">{errors.items}</p>}

                <Button type="submit" disabled={processing}>Buat Invoice</Button>
            </form>
        </AppLayout>
    );
}
