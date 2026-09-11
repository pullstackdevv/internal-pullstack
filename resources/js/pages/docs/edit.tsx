import { FormEvent, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownContent } from '@/components/app/markdown-content';

interface Category {
    id: number;
    name: string;
}

interface DocumentData {
    id: number;
    doc_category_id: number;
    title: string;
    excerpt: string | null;
    body_markdown: string;
    is_published: boolean;
}

export default function EditDocument({ document, categories }: { document: DocumentData; categories: Category[] }) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const { data, setData, put, processing, errors } = useForm({
        doc_category_id: document.doc_category_id,
        title: document.title,
        excerpt: document.excerpt ?? '',
        body_markdown: document.body_markdown,
        is_published: document.is_published,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        put(`/docs/${document.id}`);
    }

    return (
        <AppLayout>
            <PageHeader title={`Edit: ${document.title}`} />
            <form onSubmit={submit} className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Judul</Label>
                        <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                            value={String(data.doc_category_id)}
                            onValueChange={(v) => setData('doc_category_id', Number(v))}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-2 border-b">
                    <button type="button" onClick={() => setTab('write')} className={`px-3 py-2 text-sm ${tab === 'write' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Tulis
                    </button>
                    <button type="button" onClick={() => setTab('preview')} className={`px-3 py-2 text-sm ${tab === 'preview' ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}>
                        Preview
                    </button>
                </div>

                {tab === 'write' ? (
                    <Textarea
                        value={data.body_markdown}
                        onChange={(e) => setData('body_markdown', e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                    />
                ) : (
                    <div className="rounded-md border p-4">
                        <MarkdownContent markdown={data.body_markdown} />
                    </div>
                )}
                {errors.body_markdown && <p className="text-sm text-destructive">{errors.body_markdown}</p>}

                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={data.is_published}
                        onCheckedChange={(checked) => setData('is_published', checked === true)}
                    />
                    <Label>Terbitkan</Label>
                </div>

                <Button type="submit" disabled={processing}>Simpan</Button>
            </form>
        </AppLayout>
    );
}
