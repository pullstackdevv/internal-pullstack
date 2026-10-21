import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { MoneyNav } from '@/components/app/money-nav';
import {
    MoneyTransactionForm,
    type CategoryOption,
    type InvoiceOption,
    type WalletOption,
} from './transaction-form';

interface Props {
    wallets: WalletOption[];
    categories: CategoryOption[];
    invoices: InvoiceOption[];
}

export default function CreateMoneyTransaction({ wallets, categories, invoices }: Props) {
    return (
        <AppLayout>
            <PageHeader title="Transaksi Baru" />
            <MoneyNav />
            <MoneyTransactionForm
                wallets={wallets}
                categories={categories}
                invoices={invoices}
                defaults={{
                    wallet_id: wallets[0]?.id ?? 0,
                    category_id: null,
                    type: 'expense',
                    amount: 0,
                    date: new Date().toISOString().slice(0, 10),
                    note: '',
                    invoice_id: null,
                }}
                submitUrl="/money/transactions"
                submitLabel="Simpan transaksi"
            />
        </AppLayout>
    );
}
