import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import {
    MoneyTransactionForm,
    type CategoryOption,
    type InvoiceOption,
    type TransactionDefaults,
    type WalletOption,
} from './transaction-form';

interface Props {
    transaction: TransactionDefaults & { id: number };
    wallets: WalletOption[];
    categories: CategoryOption[];
    invoices: InvoiceOption[];
}

export default function EditMoneyTransaction({ transaction, wallets, categories, invoices }: Props) {
    return (
        <AppLayout>
            <PageHeader title="Edit Transaksi" />
            <MoneyTransactionForm
                wallets={wallets}
                categories={categories}
                invoices={invoices}
                defaults={transaction}
                submitUrl={`/money/transactions/${transaction.id}`}
                submitLabel="Simpan perubahan"
                method="put"
            />
        </AppLayout>
    );
}
