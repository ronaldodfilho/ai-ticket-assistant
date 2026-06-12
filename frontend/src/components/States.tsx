import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> {label}
        </div>
    );
}

export function ErrorState({ message, action }: { message: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="text-red-500" />
            <p className="text-sm text-slate-700">{message}</p>
            {action}
        </div>
    );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="mb-1 text-slate-300">{icon}</div>
            <p className="text-sm font-medium text-slate-700">{title}</p>
            {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

export function InlineError({ message }: { message: string | null }) {
    if (!message) return null;
    return <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>;
}
