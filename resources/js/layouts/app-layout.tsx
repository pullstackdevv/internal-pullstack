import { PropsWithChildren, useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Clock, FileText, Users, Settings, LayoutDashboard, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';
import { NavUser } from '@/components/app/nav-user';
import { Toaster } from '@/components/ui/sonner';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';

const ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    users: Users,
    settings: Settings,
};

const SECTION_LABELS: Array<[string, string]> = [
    ['/dashboard', 'Dashboard'],
    ['/docs', 'Dokumentasi'],
    ['/doc-categories', 'Dokumentasi'],
    ['/invoices', 'Invoice'],
    ['/clients', 'Client'],
    ['/users', 'Pengguna'],
    ['/settings', 'Pengaturan'],
];

function LiveClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    })
        .format(now)
        .replace(/\./g, ':');

    return (
        <span className="hidden items-center gap-1.5 font-mono text-[13px] text-muted-foreground sm:flex">
            <Clock className="h-4 w-4" />
            {time} WIB
        </span>
    );
}

export function AppLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedProps>();
    const { auth } = page.props;
    const currentPath = page.url.split('?')[0];
    const dashboardActive = currentPath === '/dashboard';
    const sectionLabel =
        SECTION_LABELS.find(([prefix]) => currentPath.startsWith(prefix))?.[1] ?? 'Dashboard';

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <img
                            src="/images/pullstack-mark.png"
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                        <span className="text-[15px] font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                            Pullstack
                        </span>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                            Menu
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={dashboardActive}
                                    tooltip="Dashboard"
                                    className="h-9.5"
                                >
                                    <Link href="/dashboard">
                                        <LayoutDashboard />
                                        <span>Dashboard</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {auth.modules.map((module) => {
                                const Icon = ICONS[module.icon] ?? FileText;
                                const active = currentPath.startsWith(module.href);

                                return (
                                    <SidebarMenuItem key={module.key}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={module.label}
                                            className="h-9.5"
                                        >
                                            <Link href={module.href}>
                                                <Icon />
                                                <span>{module.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl lg:px-6">
                    <SidebarTrigger />
                    <div className="h-4 w-px bg-border" />
                    <span className="text-sm font-medium text-foreground">{sectionLabel}</span>
                    <div className="ml-auto flex items-center gap-4">
                        <LiveClock />
                        <NavUser name={auth.user.name} email={auth.user.email} />
                    </div>
                </header>
                <div className="flex-1 px-8 py-7">{children}</div>
            </SidebarInset>
            <Toaster position="top-right" />
        </SidebarProvider>
    );
}
