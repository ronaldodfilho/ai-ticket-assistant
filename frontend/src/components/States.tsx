import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
    return (
        <div role="alert" className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                <AlertTriangle size={22} aria-hidden="true" />
            </span>
            <p className="max-w-sm text-sm text-foreground">{message}</p>
            {action}
        </div>
    );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-subtle text-muted-foreground" aria-hidden="true">
                {icon}
            </span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export function InlineError({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-red-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {message}
        </div>
    );
}

/** Placeholder com o formato do conteúdo, evitando saltos de layout durante a carga. */
export function Skeleton({ className = '' }: { className?: string }) {
    return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div role="status" aria-busy="true">
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}
