import { cn } from '@/lib/utils';

type Tone = 'success' | 'neutral' | 'warning';

const TONE_CLASSES: Record<Tone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    neutral: 'border-border bg-muted text-muted-foreground',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                TONE_CLASSES[tone]
            )}
        >
            {children}
        </span>
    );
}
