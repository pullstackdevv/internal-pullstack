import { FormEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Issuer {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface Payment {
    account_name: string;
    bank: string;
    account_number: string;
}

export default function SettingsIndex({ issuer, payment }: { issuer: Issuer; payment: Payment }) {
    const issuerForm = useForm({ content: issuer });
    const paymentForm = useForm({ content: payment });

    function submitIssuer(e: FormEvent) {
        e.preventDefault();
        issuerForm.put('/settings/invoice.issuer');
    }

    function submitPayment(e: FormEvent) {
        e.preventDefault();
        paymentForm.put('/settings/invoice.payment');
    }

    return (
        <AppLayout>
            <PageHeader title="Settings" description="Data penerbit dan pembayaran untuk invoice" />
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Data Penerbit</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submitIssuer} className="space-y-3">
                            <div className="space-y-1">
                                <Label>Nama</Label>
                                <Input
                                    value={issuerForm.data.content.name}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Alamat</Label>
                                <Input
                                    value={issuerForm.data.content.address}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>No. Telepon</Label>
                                <Input
                                    value={issuerForm.data.content.phone}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Email</Label>
                                <Input
                                    value={issuerForm.data.content.email}
                                    onChange={(e) => issuerForm.setData('content', { ...issuerForm.data.content, email: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={issuerForm.processing}>Simpan</Button>
                        </form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submitPayment} className="space-y-3">
                            <div className="space-y-1">
                                <Label>Nama Pemilik Rekening</Label>
                                <Input
                                    value={paymentForm.data.content.account_name}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, account_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Bank</Label>
                                <Input
                                    value={paymentForm.data.content.bank}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, bank: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Nomor Rekening</Label>
                                <Input
                                    value={paymentForm.data.content.account_number}
                                    onChange={(e) => paymentForm.setData('content', { ...paymentForm.data.content, account_number: e.target.value })}
                                />
                            </div>
                            <Button type="submit" disabled={paymentForm.processing}>Simpan</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
