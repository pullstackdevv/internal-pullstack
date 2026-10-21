import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Building2, FileText, Users, type LucideIcon } from 'lucide-react';
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

const QUICK_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
    { href: '/docs', label: 'Dokumentasi', icon: BookOpen },
    { href: '/invoices', label: 'Invoice', icon: FileText },
    { href: '/clients', label: 'Client', icon: Building2 },
    { href: '/users', label: 'Pengguna', icon: Users },
];

export default function Dashboard({ stats, recentInvoices }: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const firstName = auth.user.name.split(' ')[0];

    const statsEntries: Array<{ label: string; value: string; sub: string; valueClass: string }> = [];
    if (stats.documentCount !== null) {
        statsEntries.push({
            label: 'Dokumen terbit',
            value: String(stats.documentCount),
            sub: 'Semua dokumen yang terbit',
            valueClass: 'text-foreground',
        });
    }
    if (stats.invoiceCountThisMonth !== null) {
        statsEntries.push({
            label: 'Invoice bulan ini',
            value: String(stats.invoiceCountThisMonth),
            sub: 'Invoice dibuat bulan ini',
            valueClass: 'text-blue-600',
        });
    }
    if (stats.invoiceTotalThisMonth !== null) {
        statsEntries.push({
            label: 'Total bulan ini',
            value: `Rp ${formatRupiah(stats.invoiceTotalThisMonth)}`,
            sub: 'Nilai invoice bulan ini',
            valueClass: 'text-green-600',
        });
    }

    return (
        <AppLayout>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Halo, {firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ringkasan dokumentasi dan invoice Pullstack.</p>

            {statsEntries.length > 0 && (
                <div className="mt-6 flex flex-col divide-y divide-border rounded-xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
                    {statsEntries.map((entry) => (
                        <div key={entry.label} className="flex-1 px-6 py-5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {entry.label}
                            </p>
                            <p className={`mt-1.5 text-[28px] font-bold leading-none ${entry.valueClass}`}>
                                {entry.value}
                            </p>
                            <p className="mt-2 text-[13px] text-muted-foreground">{entry.sub}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                        <h2 className="text-sm font-semibold text-foreground">Invoice terbaru</h2>
                        <Link href="/invoices" className="text-sm text-primary hover:underline">
                            Lihat semua
                        </Link>
                    </div>
                    {recentInvoices.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-muted/40">
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
                                        <TableCell className="font-mono text-sm">
                                            {formatIndonesianDate(invoice.issue_date)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            Rp {formatRupiah(Number(invoice.total))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="px-5 py-6 text-sm text-muted-foreground">Belum ada invoice terbaru.</p>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="border-b border-border px-5 py-3.5">
                        <h2 className="text-sm font-semibold text-foreground">Akses cepat</h2>
                    </div>
                    <nav className="divide-y divide-border">
                        {QUICK_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50"
                            >
                                <link.icon className="h-4 w-4 shrink-0 text-primary" />
                                <span className="font-medium text-foreground">{link.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </AppLayout>
    );
}
