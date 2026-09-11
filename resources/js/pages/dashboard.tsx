import { Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRupiah, formatIndonesianDate } from '@/lib/format';
import type { SharedProps } from '@/types';

interface Stats {
    documentCount: number | null;
    invoiceCountThisMonth: number | null;
    invoiceTotalThisMonth: number | null;
}

interface RecentInvoice {
    id: number;
    number: string;
    client_name: string;
    issue_date: string;
    total: string;
}

interface DashboardProps {
    stats: Stats;
    recentInvoices: RecentInvoice[];
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{value}</p>
        </div>
    );
}

export default function Dashboard({ stats, recentInvoices }: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <AppLayout>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Halo, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ringkasan dokumentasi dan invoice Pullstack.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {stats.documentCount !== null && (
                    <StatCard label="Dokumen terbit" value={String(stats.documentCount)} />
                )}
                {stats.invoiceCountThisMonth !== null && (
                    <StatCard label="Invoice bulan ini" value={String(stats.invoiceCountThisMonth)} />
                )}
                {stats.invoiceTotalThisMonth !== null && (
                    <StatCard label="Total bulan ini" value={`Rp ${formatRupiah(stats.invoiceTotalThisMonth)}`} />
                )}
            </div>

            {recentInvoices.length > 0 && (
                <div className="mt-8">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-foreground">Invoice terbaru</h2>
                        <Link href="/invoices" className="text-sm text-primary hover:underline">
                            Lihat semua
                        </Link>
                    </div>
                    <div className="rounded-lg border border-border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nomor</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentInvoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                                        <TableCell>{invoice.client_name}</TableCell>
                                        <TableCell>{formatIndonesianDate(invoice.issue_date)}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            Rp {formatRupiah(Number(invoice.total))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
