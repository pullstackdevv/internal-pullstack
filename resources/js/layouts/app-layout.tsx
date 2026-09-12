import { PropsWithChildren } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LogOut, BookOpen, FileText, Users, Settings, LayoutDashboard, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
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

const ACTIVE_RAIL = 'data-[active=true]:border-l-2 data-[active=true]:border-sidebar-primary';

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
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2.5 px-1 py-1">
                        <img
                            src="/images/pullstack-mark.png"
                            alt=""
                            className="h-7 w-7 shrink-0 rounded-md object-cover"
                        />
                        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                            Pullstack
                        </span>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={currentPath === '/dashboard'}
                                    tooltip="Dashboard"
                                    className={ACTIVE_RAIL}
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
                                            className={ACTIVE_RAIL}
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

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => router.post('/logout')} tooltip="Keluar">
                                <LogOut />
                                <span>Keluar</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
                    <SidebarTrigger />
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{auth.user.email}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                            {initials(auth.user.name)}
                        </div>
                    </div>
                </header>
                <div className="flex-1 px-8 py-7">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
