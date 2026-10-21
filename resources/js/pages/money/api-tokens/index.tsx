import * as React from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatIndonesianDate } from '@/lib/format';

interface TokenRow {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    created_at: string | null;
}

interface Props {
    tokens: TokenRow[];
    availableAbilities: string[];
    plainToken: string | null;
}

const ABILITY_DESCRIPTIONS: Record<string, string> = {
    'money:read': 'Baca saldo, transaksi, ringkasan',
    'money:write': 'Tambah, ubah, hapus transaksi',
    'money:export': 'Unduh ekspor CSV',
    'money:admin': 'Kelola kategori & dompet lewat API',
};

export default function MoneyApiTokensIndex({ tokens, availableAbilities, plainToken }: Props) {
    const [name, setName] = React.useState('');
    const [abilities, setAbilities] = React.useState<string[]>(['money:read']);

    function toggleAbility(ability: string, checked: boolean) {
        setAbilities((prev) => (checked ? [...prev, ability] : prev.filter((a) => a !== ability)));
    }

    function createToken(e: React.FormEvent) {
        e.preventDefault();
        router.post('/money/api-tokens', { name, abilities }, {
            onSuccess: () => setName(''),
        });
    }

    async function copyToken() {
        if (!plainToken) return;
        try {
            await navigator.clipboard.writeText(plainToken);
            toast.success('Token tersalin');
        } catch {
            toast.error('Gagal menyalin token.');
        }
    }

    return (
        <AppLayout>
            <PageHeader
                title="Token MCP"
                description="Token untuk agent AI yang mengelola keuangan lewat MCP server. Permission token = scope yang dipilih di sini."
            />

            {plainToken && (
                <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                    <p className="text-sm font-semibold text-green-800">Token baru dibuat — salin sekarang, token ini hanya tampil sekali:</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 break-all rounded-md border border-green-200 bg-white px-3 py-2 font-mono text-xs">
                            {plainToken}
                        </code>
                        <Button type="button" variant="outline" onClick={copyToken}>Salin token</Button>
                    </div>
                    <p className="mt-2 text-[13px] text-green-700">
                        Pasang sebagai env <code className="font-mono">PULLSTACK_API_TOKEN</code> pada konfigurasi MCP client.
                    </p>
                </div>
            )}

            <form onSubmit={createToken} className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Buat token baru</h2>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label>Nama token</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Agent Keuangan Laptop" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Permission (scope)</Label>
                        <div className="space-y-2">
                            {availableAbilities.map((ability) => (
                                <label key={ability} className="flex items-start gap-2 text-sm">
                                    <Checkbox
                                        checked={abilities.includes(ability)}
                                        onCheckedChange={(checked) => toggleAbility(ability, checked === true)}
                                    />
                                    <span>
                                        <span className="font-mono text-[13px] font-medium">{ability}</span>
                                        <span className="block text-xs text-muted-foreground">{ABILITY_DESCRIPTIONS[ability]}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <Button type="submit" className="mt-4" disabled={abilities.length === 0}>Buat token</Button>
            </form>

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>Permission</TableHead>
                            <TableHead>Terakhir dipakai</TableHead>
                            <TableHead>Dibuat</TableHead>
                            <TableHead className="w-24" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tokens.map((token) => (
                            <TableRow key={token.id}>
                                <TableCell className="font-medium">{token.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {token.abilities.map((ability) => (
                                            <span key={ability} className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
                                                {ability}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {token.last_used_at ? formatIndonesianDate(token.last_used_at.slice(0, 10)) : 'Belum pernah'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {token.created_at ? formatIndonesianDate(token.created_at.slice(0, 10)) : '—'}
                                </TableCell>
                                <TableCell>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                Revoke
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Revoke token {token.name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Agent yang memakai token ini langsung kehilangan akses. Tindakan ini tidak bisa dibatalkan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => router.delete(`/money/api-tokens/${token.id}`)}>
                                                    Revoke
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tokens.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Belum ada token. Buat token pertama untuk agent kamu.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
