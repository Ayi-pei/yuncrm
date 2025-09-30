interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">{title}</h1>
                {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
        </div>
    );
}
