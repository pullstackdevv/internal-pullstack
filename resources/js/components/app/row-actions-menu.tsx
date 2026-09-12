import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
    editHref?: string;
    editLabel?: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    confirmTitle?: string;
    confirmDescription?: string;
}

export function RowActionsMenu({
    editHref,
    editLabel = 'Edit',
    onConfirm,
    confirmLabel = 'Hapus',
    confirmTitle = 'Yakin?',
    confirmDescription = 'Tindakan ini tidak bisa dibatalkan.',
}: Props) {
    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Buka menu aksi</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {editHref && (
                        <DropdownMenuItem asChild>
                            <Link href={editHref}>{editLabel}</Link>
                        </DropdownMenuItem>
                    )}
                    {onConfirm && (
                        <>
                            {editHref && <DropdownMenuSeparator />}
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem variant="destructive" onSelect={(e) => e.preventDefault()}>
                                    {confirmLabel}
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
