import { router } from '@inertiajs/react';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

interface Props {
    name: string;
    email: string;
}

export function NavUser({ name, email }: Props) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg">
                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-secondary text-xs font-semibold text-primary">
                                    {initials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left leading-tight">
                                <span className="truncate text-sm font-medium">{name}</span>
                                <span className="truncate text-xs text-muted-foreground">{email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="grid text-left leading-tight">
                                <span className="truncate text-sm font-medium">{name}</span>
                                <span className="truncate text-xs text-muted-foreground">{email}</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.post('/logout')}>
                            <LogOut />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
