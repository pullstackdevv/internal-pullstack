import { router } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-[13px] font-semibold text-primary-foreground">
                            {initials(name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Menu akun {name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-56">
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
    );
}
