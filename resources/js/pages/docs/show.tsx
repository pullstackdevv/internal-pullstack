import { Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { MarkdownContent, extractHeadings } from '@/components/app/markdown-content';

interface DocumentData {
    id: number;
    title: string;
    body_markdown: string;
}

export default function ShowDocument({ document }: { document: DocumentData }) {
    const headings = extractHeadings(document.body_markdown).filter((h) => h.depth >= 2 && h.depth <= 3);

    return (
        <AppLayout>
            <div className="flex items-start gap-10">
                <article className="min-w-0 max-w-3xl flex-1 rounded-lg border border-border bg-card p-8">
                    <MarkdownContent markdown={document.body_markdown} />
                    <div className="mt-8 border-t border-border pt-4">
                        <Link
                            href={`/docs-manage/${document.id}/edit`}
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit dokumen ini
                        </Link>
                    </div>
                </article>

                {headings.length > 0 && (
                    <aside className="hidden w-52 shrink-0 xl:block">
                        <div className="sticky top-6">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Daftar isi
                            </p>
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
