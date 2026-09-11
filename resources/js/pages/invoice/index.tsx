import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah, formatIndonesianDate } from '@/lib/format';
import { Download, Pencil } from 'lucide-react';

interface InvoiceRow {
    id: number;
    number: string;
    client_name: string;
    issue_date: string;
    total: string;
}

export default function InvoicesIndex({ invoices }: { invoices: InvoiceRow[] }) {
    return (
        <AppLayout>
            <PageHeader
                title="Invoice"
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild><Link href="/clients">Kelola Client</Link></Button>
                        <Button asChild><Link href="/invoices/create">Buat Invoice</Link></Button>
                    </div>
                }
            />
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead>Nomor</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                            <TableCell>{invoice.client_name}</TableCell>
                            <TableCell>{formatIndonesianDate(invoice.issue_date)}</TableCell>
                            <TableCell className="text-right font-mono">{formatRupiah(Number(invoice.total))}</TableCell>
                            <TableCell className="space-x-2 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                        <Download className="mr-1 h-3.5 w-3.5" />
                                        PDF
                                    </a>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/invoices/${invoice.id}/edit`}>
                                        <Pencil className="mr-1 h-3.5 w-3.5" />
                                        Edit
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </AppLayout>
    );
}
