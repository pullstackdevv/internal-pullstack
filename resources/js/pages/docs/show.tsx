import { Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { MarkdownContent, extractHeadings } from '@/components/app/markdown-content';

interface DocumentData {
    id: number;
    title: string;
    body_markdown: string;
}

export default function ShowDocument({ document }: { document: DocumentData }) {
    const headings = extractHeadings(document.body_markdown).filter((h) => h.depth <= 2);

    return (
        <AppLayout>
            <div className="flex gap-8">
                <article className="min-w-0 flex-1">
                    <h1 className="mb-4 text-2xl font-semibold">{document.title}</h1>
                    <MarkdownContent markdown={document.body_markdown} />
                    <div className="mt-6">
                        <Link href={`/docs-manage/${document.id}/edit`} className="text-sm text-primary hover:underline">
                            Edit dokumen ini
                        </Link>
                    </div>
                </article>
                {headings.length > 0 && (
                    <aside className="hidden w-56 shrink-0 lg:block">
                        <div className="sticky top-6 space-y-1 text-sm">
                            <p className="mb-2 font-medium text-muted-foreground">Daftar Isi</p>
                            {headings.map((h) => (
                                <a
                                    key={h.id}
                                    href={`#${h.id}`}
                                    className="block text-muted-foreground hover:text-foreground"
                                    style={{ paddingLeft: `${(h.depth - 1) * 12}px` }}
                                >
                                    {h.text}
                                </a>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </AppLayout>
    );
}
