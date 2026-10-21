import { cn } from '@/lib/utils';

type Tone = 'success' | 'neutral' | 'warning';

const TONE_CLASSES: Record<Tone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    warning: 'border-orange-200 bg-orange-50 text-orange-700',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                TONE_CLASSES[tone]
            )}
        >
            {children}
        </span>
    );
}
