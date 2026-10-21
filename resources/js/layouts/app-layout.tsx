import { PropsWithChildren, useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    BookOpen,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    KeyRound,
    Landmark,
    LayoutDashboard,
    Settings,
    Settings2,
    Tags,
    Target,
    Users,
    Wallet,
    LucideIcon,
} from 'lucide-react';
import type { ModuleLink, SharedProps } from '@/types';
import { NavUser } from '@/components/app/nav-user';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';

const ICONS: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'file-text': FileText,
    users: Users,
    settings: Settings,
    wallet: Wallet,
};

const SECTION_LABELS: Array<[string, string]> = [
    ['/dashboard', 'Dashboard'],
    ['/docs', 'Dokumentasi'],
    ['/doc-categories', 'Dokumentasi'],
    ['/invoices', 'Invoice'],
    ['/clients', 'Client'],
    ['/money/api-tokens', 'Token MCP'],
    ['/money/transactions', 'Transaksi'],
    ['/money/wallets', 'Dompet'],
    ['/money/categories', 'Kategori'],
    ['/money/budgets', 'Anggaran'],
    ['/money/report', 'Laporan'],
    ['/money', 'Keuangan'],
    ['/users', 'Pengguna'],
    ['/settings', 'Pengaturan'],
];

interface NavSubItem {
    href: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
}

interface NavGroupProps {
    label: string;
    icon: LucideIcon;
    landingHref: string;
    items: NavSubItem[];
}

/* Grup menu collapsible (Keuangan, Management). Terbuka otomatis bila ada
   sub-item aktif; header bisa di-toggle manual. Saat sidebar diciutkan jadi
   ikon, header berubah jadi link ke halaman utama grup. */
function NavGroup({ label, icon: Icon, landingHref, items }: NavGroupProps) {
    const { state, isMobile } = useSidebar();
    const iconMode = state === 'collapsed' && !isMobile;
    const hasActive = items.some((item) => item.active);
    const [toggled, setToggled] = useState<boolean | null>(null);
    const open = toggled ?? hasActive;

    if (iconMode) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={hasActive} tooltip={label} className="h-9.5">
                    <Link href={landingHref}>
                        <Icon />
                        <span>{label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={hasActive}
                tooltip={label}
                className="h-9.5"
                onClick={() => setToggled(!open)}
            >
                <Icon />
                <span>{label}</span>
                <ChevronRight
                    className={cn('ml-auto h-4 w-4 shrink-0 transition-transform', open && 'rotate-90')}
                />
            </SidebarMenuButton>
            {open && (
                <SidebarMenuSub>
                    {items.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={item.active}>
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}

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

    const byHref = (href: string): ModuleLink | undefined =>
        auth.modules.find((module) => module.href === href);
    const moneyModule = byHref('/money');
    const usersModule = byHref('/users');
    const settingsModule = byHref('/settings');
    const groupedHrefs = new Set(['/money', '/users', '/settings']);
    const standaloneModules = auth.modules.filter((module) => !groupedHrefs.has(module.href));
    const isAdmin = auth.user.role === 'admin';

    const moneyItems: NavSubItem[] = moneyModule
        ? [
              {
                  href: '/money',
                  label: 'Dashboard',
                  icon: LayoutDashboard,
                  active: currentPath === '/money',
              },
              {
                  href: '/money/transactions',
                  label: 'Transaksi',
                  icon: ArrowRightLeft,
                  active: currentPath.startsWith('/money/transactions'),
              },
              {
                  href: '/money/wallets',
                  label: 'Dompet',
                  icon: Landmark,
                  active: currentPath.startsWith('/money/wallets'),
              },
              {
                  href: '/money/categories',
                  label: 'Kategori',
                  icon: Tags,
                  active: currentPath.startsWith('/money/categories'),
              },
              {
                  href: '/money/budgets',
                  label: 'Anggaran',
                  icon: Target,
                  active: currentPath.startsWith('/money/budgets'),
              },
              {
                  href: '/money/report',
                  label: 'Laporan',
                  icon: FileSpreadsheet,
                  active: currentPath.startsWith('/money/report'),
              },
          ]
        : [];

    const managementItems: NavSubItem[] = [
        ...(usersModule
            ? [
                  {
                      href: '/users',
                      label: 'Pengguna',
                      icon: Users,
                      active: currentPath.startsWith('/users'),
                  },
              ]
            : []),
        ...(settingsModule
            ? [
                  {
                      href: '/settings',
                      label: 'Pengaturan',
                      icon: Settings,
                      active: currentPath.startsWith('/settings'),
                  },
              ]
            : []),
        ...(isAdmin && moneyModule
            ? [
                  {
                      href: '/money/api-tokens',
                      label: 'Token MCP',
                      icon: KeyRound,
                      active: currentPath.startsWith('/money/api-tokens'),
                  },
              ]
            : []),
    ];

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

                            {standaloneModules.map((module) => {
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

                            {moneyModule && (
                                <NavGroup
                                    label="Keuangan"
                                    icon={Wallet}
                                    landingHref="/money"
                                    items={moneyItems}
                                />
                            )}

                            {managementItems.length > 0 && (
                                <NavGroup
                                    label="Management"
                                    icon={Settings2}
                                    landingHref={managementItems[0].href}
                                    items={managementItems}
                                />
                            )}
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
