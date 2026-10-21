interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
        </div>
    );
}
