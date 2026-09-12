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
                <div key={index} className="overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                        <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(index)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Hapus item {index + 1}</span>
                        </Button>
                    </div>

                    <div className="grid gap-px bg-border md:grid-cols-2">
                        <Textarea
                            value={item.description}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            placeholder={'Deskripsi pekerjaan — pakai "- " buat list, "**tebal**" buat penekanan'}
                            rows={4}
                            className="rounded-none border-0 bg-card shadow-none focus-visible:ring-0"
                        />
                        <div className="bg-card p-3">
                            <p className="mb-1.5 text-xs text-muted-foreground">Preview</p>
                            {item.description ? (
                                <div className="prose prose-sm max-w-none text-sm prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground/60">Belum ada deskripsi</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border bg-card p-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Month</Label>
                            <Input
                                value={item.month}
                                onChange={(e) => updateItem(index, { month: e.target.value })}
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-1.5">
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
