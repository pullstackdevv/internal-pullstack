import { Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { MarkdownContent, extractHeadings } from '@/components/app/markdown-content';
import { DocsNav, DocsNavGroup } from '@/components/docs/docs-nav';

interface DocumentData {
    id: number;
    slug: string;
    title: string;
    body_markdown: string;
}

interface ShowDocumentProps {
    document: DocumentData;
    nav: DocsNavGroup[];
    canManage: boolean;
}

export default function ShowDocument({ document, nav, canManage }: ShowDocumentProps) {
    const headings = extractHeadings(document.body_markdown).filter((h) => h.depth >= 2 && h.depth <= 3);

    return (
        <AppLayout>
            <div className="flex items-start gap-10">
                <DocsNav groups={nav} currentSlug={document.slug} />

                <div className="min-w-0 max-w-3xl flex-1">
                    <Link
                        href="/docs"
                        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Semua dokumentasi
                    </Link>
                    <article className="rounded-lg border border-border bg-card p-8">
                        <MarkdownContent markdown={document.body_markdown} />
                        {canManage && (
                            <div className="mt-8 border-t border-border pt-4">
                                <Link
                                    href={`/docs-manage/${document.id}/edit`}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit dokumen ini
                                </Link>
                            </div>
                        )}
                    </article>
                </div>

                {headings.length > 0 && (
                    <aside className="hidden w-52 shrink-0 xl:block">
                        <div className="sticky top-6">
                            <p className="mb-3 text-sm font-medium text-muted-foreground">Daftar isi</p>
                            <nav className="space-y-2 border-l border-border">
                                {headings.map((h) => (
                                    <a
                                        key={h.id}
                                        href={`#${h.id}`}
                                        className="block border-l-2 border-transparent py-0.5 text-sm leading-snug text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                                        style={{
                                            marginLeft: '-1px',
                                            paddingLeft: h.depth === 3 ? '28px' : '14px',
                                        }}
                                    >
                                        {h.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}
            </div>
        </AppLayout>
    );
}