import { Link } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';

export interface DocsNavItem {
    id: number;
    slug: string;
    title: string;
}

export interface DocsNavGroup {
    name: string;
    documents: DocsNavItem[];
}

interface DocsNavProps {
    groups: DocsNavGroup[];
    currentSlug?: string;
}

export function DocsNav({ groups, currentSlug }: DocsNavProps) {
    return (
        <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-6 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
                <div className="mb-4 flex items-center gap-2 px-3">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold tracking-tight text-foreground">Dokumentasi</span>
                </div>
                <nav className="space-y-5">
                    {groups.map((group) => (
                        <div key={group.name}>
                            <p className="mb-1.5 px-3 text-[13px] font-medium text-muted-foreground">{group.name}</p>
                            <ul className="space-y-0.5">
                                {group.documents.map((doc) => {
                                    const active = doc.slug === currentSlug;

                                    return (
                                        <li key={doc.id}>
                                            <Link
                                                href={`/docs/${doc.slug}`}
                                                aria-current={active ? 'page' : undefined}
                                                className={[
                                                    'block rounded-md px-3 py-1.5 text-sm leading-snug transition-colors',
                                                    active
                                                        ? 'bg-primary/10 font-medium text-primary'
                                                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                                                ].join(' ')}
                                            >
                                                {doc.title}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}