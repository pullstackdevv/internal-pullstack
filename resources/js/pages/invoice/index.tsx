import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah, formatIndonesianDate } from '@/lib/format';
import { Download } from 'lucide-react';
import { RowActionsMenu } from '@/components/app/row-actions-menu';

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
            <div className="mt-4 rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nomor</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-28" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                                <TableCell className="font-medium">{invoice.client_name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatIndonesianDate(invoice.issue_date)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {formatRupiah(Number(invoice.total))}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <a href={`/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                                                <Download className="h-4 w-4" />
                                                <span className="sr-only">Download PDF</span>
                                            </a>
                                        </Button>
                                        <RowActionsMenu
                                            editHref={`/invoices/${invoice.id}/edit`}
                                            onConfirm={() => router.delete(`/invoices/${invoice.id}`)}
                                            confirmTitle={`Hapus invoice ${invoice.number}?`}
                                            confirmDescription="Nomor invoice ini tidak akan dipakai ulang setelah dihapus."
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
