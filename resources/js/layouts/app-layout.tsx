import { PropsWithChildren } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, FileText, Users, Settings, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    users: Users,
    settings: Settings,
};

export function AppLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<SharedProps>().props;

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 shrink-0 border-r bg-muted/30 p-4">
                <div className="mb-6 px-2 text-lg font-bold">Pullstack</div>
                <nav className="space-y-1">
                    {auth.modules.map((module) => {
                        const Icon = ICONS[module.icon] ?? FileText;

                        return (
                            <Link
                                key={module.key}
                                href={module.href}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                            >
                                <Icon className="h-4 w-4" />
                                {module.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-between border-b px-6 py-3">
                    <span className="text-sm text-muted-foreground">{auth.user.email}</span>
                    <Button variant="ghost" size="sm" onClick={() => router.post('/logout')}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Keluar
                    </Button>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
