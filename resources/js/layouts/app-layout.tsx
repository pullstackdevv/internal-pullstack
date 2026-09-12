import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FileText, Users, Settings, LayoutDashboard, LucideIcon } from 'lucide-react';
import type { SharedProps } from '@/types';
import { NavUser } from '@/components/app/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
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

export function AppLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedProps>();
    const { auth } = page.props;
    const currentPath = page.url.split('?')[0];

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <img
                            src="/images/pullstack-mark.png"
                            alt=""
                            className="h-7 w-7 shrink-0 rounded-md object-cover"
                        />
                        <span className="text-[15px] font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
                            Pullstack
                        </span>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={currentPath === '/dashboard'}
                                    tooltip="Dashboard"
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
                                        <SidebarMenuButton asChild isActive={active} tooltip={module.label}>
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
                    <NavUser name={auth.user.name} email={auth.user.email} />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                    <SidebarTrigger />
                </header>
                <div className="flex-1 px-8 py-7">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
