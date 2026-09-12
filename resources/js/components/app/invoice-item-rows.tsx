import { Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

function hasMarkdown(text: string): boolean {
    return /^[-*]\s|^\d+\.\s|\*\*.+\*\*/m.test(text);
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
            <Label>Job Description</Label>
            {items.map((item, index) => (
                <div key={index} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-start gap-2">
                        <Textarea
                            value={item.description}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            placeholder={'Deskripsi pekerjaan — pakai "- " buat list, "**tebal**" buat penekanan'}
                            rows={2}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeItem(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    {hasMarkdown(item.description) && (
                        <div className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Month</Label>
                            <Input
                                value={item.month}
                                onChange={(e) => updateItem(index, { month: e.target.value })}
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Subtotal</Label>
                            <Input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
                            />
                        </div>
                    </div>
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
