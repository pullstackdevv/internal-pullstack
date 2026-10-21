import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, ColumnsIcon, Download, SearchIcon } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { RowActionsMenu } from '@/components/app/row-actions-menu';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatIndonesianDate, formatRupiah } from '@/lib/format';

interface InvoiceRow {
    id: number;
    number: string;
    client_name: string;
    issue_date: string;
    due_date: string | null;
    status: 'unpaid' | 'paid';
    total: string;
}

const columns: ColumnDef<InvoiceRow>[] = [
    {
        accessorKey: 'number',
        header: 'Nomor',
        cell: ({ row }) => <span className="font-mono text-sm">{row.getValue<string>('number')}</span>,
    },
    {
        accessorKey: 'client_name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Client
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => <span className="font-medium">{row.getValue<string>('client_name')}</span>,
    },
    {
        accessorKey: 'issue_date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="-ml-3 h-8"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Tanggal
                <ArrowUpDown />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="font-mono text-sm text-muted-foreground">{formatIndonesianDate(row.getValue<string>('issue_date'))}</span>
        ),
        sortingFn: (a, b) => a.original.issue_date.localeCompare(b.original.issue_date),
    },
    {
        accessorKey: 'total',
        header: ({ column }) => (
            <div className="text-right">
                <Button
                    variant="ghost"
                    className="-mr-3 h-8"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Total
                    <ArrowUpDown />
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-right font-mono">{formatRupiah(Number(row.getValue<string>('total')))}</div>
        ),
        sortingFn: (a, b) => Number(a.original.total) - Number(b.original.total),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue<'unpaid' | 'paid'>('status');
            return <StatusBadge tone={status === 'paid' ? 'success' : 'warning'}>{status === 'paid' ? 'Lunas' : 'Belum Bayar'}</StatusBadge>;
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const invoice = row.original;

            return (
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
            );
        },
    },
];

export default function InvoicesIndex({ invoices }: { invoices: InvoiceRow[] }) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

    const table = useReactTable({
        data: invoices,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: { sorting, columnFilters, columnVisibility },
    });

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

            <div className="mt-6 flex flex-col divide-y divide-border rounded-xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
                <div className="flex-1 px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Jumlah invoice
                    </p>
                    <p className="mt-1.5 text-[28px] font-bold leading-none text-foreground">{invoices.length}</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">Semua invoice yang tercatat</p>
                </div>
                <div className="flex-1 px-6 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total nilai
                    </p>
                    <p className="mt-1.5 text-[28px] font-bold leading-none text-green-600">
                        Rp {formatRupiah(invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0))}
                    </p>
                    <p className="mt-2 text-[13px] text-muted-foreground">Akumulasi semua invoice</p>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border p-3">
                    <InputGroup className="max-w-xs">
                        <InputGroupInput
                            placeholder="Cari client..."
                            value={(table.getColumn('client_name')?.getFilterValue() as string) ?? ''}
                            onChange={(e) => table.getColumn('client_name')?.setFilterValue(e.target.value)}
                        />
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                    </InputGroup>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <ColumnsIcon />
                                Kolom
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id === 'client_name' ? 'client' : column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Table>
                    <TableHeader className="bg-muted/40">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    Belum ada invoice.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-between border-t border-border p-3">
                    <p className="text-sm text-muted-foreground">
                        {table.getFilteredRowModel().rows.length} invoice
                    </p>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Sebelumnya
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
