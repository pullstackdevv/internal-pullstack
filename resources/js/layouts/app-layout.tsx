import { PropsWithChildren } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LogOut, BookOpen, FileText, Users, Settings, LayoutDashboard, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';

const ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    users: Users,
    settings: Settings,
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function AppLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedProps>();
    const { auth } = page.props;
    const currentPath = page.url.split('?')[0];

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="flex w-60 shrink-0 flex-col bg-(--brand-indigo-900) text-white">
                <div className="flex items-center gap-2.5 px-5 py-6">
                    <img src="/images/pullstack-mark.png" alt="" className="h-8 w-8 rounded-md object-cover" />
                    <span className="text-[15px] font-semibold tracking-tight">Pullstack</span>
                </div>

                <nav className="flex-1 space-y-0.5 px-3">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-2.5 rounded-md py-2 pl-3 pr-3 text-sm transition-colors ${
                            currentPath === '/dashboard'
                                ? 'border-l-2 border-(--brand-orange-500) bg-white/10 font-medium text-white'
                                : 'border-l-2 border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>

                    {auth.modules.map((module) => {
                        const Icon = ICONS[module.icon] ?? FileText;
                        const active = currentPath.startsWith(module.href);

                        return (
                            <Link
                                key={module.key}
                                href={module.href}
                                className={`flex items-center gap-2.5 rounded-md py-2 pl-3 pr-3 text-sm transition-colors ${
                                    active
                                        ? 'border-l-2 border-(--brand-orange-500) bg-white/10 font-medium text-white'
                                        : 'border-l-2 border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {module.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 px-3 py-3">
                    <button
                        onClick={() => router.post('/logout')}
                        className="flex w-full items-center gap-2.5 rounded-md py-2 pl-3 pr-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Keluar
                    </button>
                </div>
            </aside>

            <div className="flex flex-1 flex-col">
                <header className="flex items-center justify-end gap-3 border-b border-border bg-card px-6 py-3">
                    <span className="text-sm text-muted-foreground">{auth.user.email}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                        {initials(auth.user.name)}
                    </div>
                </header>
                <main className="flex-1 px-8 py-7">{children}</main>
            </div>
        </div>
    );
}
