import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';

export interface InvoiceItem {
    description: string;
    month: string;
    amount: number;
}

interface Props {
    items: InvoiceItem[];
    onChange: (items: InvoiceItem[]) => void;
    defaultMonth: string;
}

export function InvoiceItemRows({ items, onChange, defaultMonth }: Props) {
    function updateItem(index: number, patch: Partial<InvoiceItem>) {
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    }

    function addItem() {
        onChange([...items, { description: '', month: defaultMonth, amount: 0 }]);
    }

    function removeItem(index: number) {
        onChange(items.filter((_, i) => i !== index));
    }

    const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-[1fr_140px_140px_40px] gap-2 text-sm font-medium text-muted-foreground">
                <span>Job Description</span>
                <span>Month</span>
                <span>Subtotal</span>
                <span />
            </div>
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_140px_140px_40px] items-center gap-2">
                    <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder="Deskripsi pekerjaan"
                    />
                    <Input
                        value={item.month}
                        onChange={(e) => updateItem(index, { month: e.target.value })}
                        placeholder="-"
                    />
                    <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Baris
            </Button>
            <div className="flex justify-end border-t border-border pt-3 text-right">
                <span className="font-mono text-base font-semibold text-foreground">Total: Rp {formatRupiah(total)}</span>
            </div>
        </div>
    );
}
