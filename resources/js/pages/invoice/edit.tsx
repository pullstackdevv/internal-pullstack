import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InvoiceItemRows, InvoiceItem } from '@/components/app/invoice-item-rows';
import { currentMonthLabel } from '@/lib/format';

interface ClientOption {
    id: number;
    name: string;
}

interface InvoiceData {
    id: number;
    number: string;
    client_id: number;
    issue_date: string;
    content: { items: InvoiceItem[] };
}

export default function EditInvoice({ invoice, clients }: { invoice: InvoiceData; clients: ClientOption[] }) {
    const defaultMonth = currentMonthLabel();
    const { data, setData, put, processing, errors } = useForm<{
        client_id: number;
        issue_date: string;
        items: InvoiceItem[];
    }>({
        client_id: invoice.client_id,
        issue_date: invoice.issue_date.slice(0, 10),
        items: invoice.content.items,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/invoices/${invoice.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit Invoice`} description={invoice.number} />
            <form onSubmit={submit} className="mt-4 max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Invoice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Client</Label>
                                <Select
                                    value={String(data.client_id)}
                                    onValueChange={(v) => setData('client_id', Number(v))}
                                >
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={processing}>Simpan</Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}
