import { Link, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/status-badge';
import { RowActionsMenu } from '@/components/app/row-actions-menu';
import { DocsNav, DocsNavGroup } from '@/components/docs/docs-nav';

interface DocumentRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    is_published: boolean;
    category: { name: string };
}

interface DocumentsIndexProps {
    documents: DocumentRow[];
    nav: DocsNavGroup[];
    canManage: boolean;
}

export default function DocumentsIndex({ documents, nav, canManage }: DocumentsIndexProps) {
    const grouped = documents.reduce<Record<string, DocumentRow[]>>((acc, doc) => {
        (acc[doc.category.name] ??= []).push(doc);
        return acc;
    }, {});

    return (
        <AppLayout>
            <div className="flex items-start gap-10">
                <DocsNav groups={nav} />
                <div className="min-w-0 flex-1">
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
                    <div className="mt-6 space-y-8">
                        {Object.entries(grouped).map(([categoryName, docs]) => (
                            <div key={categoryName}>
                                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{categoryName}</h2>
                                <div className="space-y-2">
                                    {docs.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                                        >
                                            <Link href={`/docs/${doc.slug}`} className="min-w-0 flex-1">
                                                <p className="truncate font-medium">{doc.title}</p>
                                                {doc.excerpt && (
                                                    <p className="truncate text-sm text-muted-foreground">{doc.excerpt}</p>
                                                )}
                                            </Link>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {!doc.is_published && <StatusBadge tone="warning">Draft</StatusBadge>}
                                                {canManage && (
                                                    <RowActionsMenu
                                                        editHref={`/docs-manage/${doc.id}/edit`}
                                                        onConfirm={() => router.delete(`/docs/${doc.id}`)}
                                                        confirmTitle={`Hapus ${doc.title}?`}
                                                        confirmDescription="Tindakan ini tidak bisa dibatalkan."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
