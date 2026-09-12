import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/status-badge';

interface DocumentRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    is_published: boolean;
    category: { name: string };
}

export default function DocumentsIndex({ documents, canManage }: { documents: DocumentRow[]; canManage: boolean }) {
    const grouped = documents.reduce<Record<string, DocumentRow[]>>((acc, doc) => {
        (acc[doc.category.name] ??= []).push(doc);
        return acc;
    }, {});

    return (
        <AppLayout>
            <PageHeader
                title="Dokumentasi"
                action={
                    canManage && (
                        <div className="flex gap-2">
                            <Button variant="outline" asChild><Link href="/doc-categories">Kelola Kategori</Link></Button>
                            <Button asChild><Link href="/docs-manage/create">Dokumen Baru</Link></Button>
                        </div>
                    )
                }
            />
            <div className="mt-4 space-y-6">
                {Object.entries(grouped).map(([categoryName, docs]) => (
                    <div key={categoryName}>
                        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{categoryName}</h2>
                        <div className="space-y-2">
                            {docs.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/docs/${doc.slug}`}
                                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted/50"
                                >
                                    <div>
                                        <p className="font-medium">{doc.title}</p>
                                        {doc.excerpt && <p className="text-sm text-muted-foreground">{doc.excerpt}</p>}
                                    </div>
                                    {!doc.is_published && <StatusBadge tone="warning">Draft</StatusBadge>}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
}
