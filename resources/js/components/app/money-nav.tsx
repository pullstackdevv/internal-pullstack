import { Link, usePage } from '@inertiajs/react';
import type { SharedProps } from '@/types';
import { cn } from '@/lib/utils';

const LINKS: Array<{ href: string; label: string; exact?: boolean; adminOnly?: boolean }> = [
    { href: '/money', label: 'Dashboard', exact: true },
    { href: '/money/transactions', label: 'Transaksi' },
    { href: '/money/wallets', label: 'Dompet' },
    { href: '/money/categories', label: 'Kategori' },
    { href: '/money/budgets', label: 'Anggaran' },
    { href: '/money/report', label: 'Laporan' },
    { href: '/money/api-tokens', label: 'Token MCP', adminOnly: true },
];

export function MoneyNav() {
    const page = usePage<SharedProps>();
    const currentPath = page.url.split('?')[0];
    const isAdmin = page.props.auth.user.role === 'admin';

    return (
        <nav className="mt-4 flex flex-wrap gap-1 border-b border-border pb-px">
            {LINKS.filter((link) => !link.adminOnly || isAdmin).map((link) => {
                const active = link.exact ? currentPath === link.href : currentPath.startsWith(link.href);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
                            active
                                ? 'border-primary font-medium text-foreground'
                                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
