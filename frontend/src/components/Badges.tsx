import type { TicketPriority, TicketStatus } from '../api/types';
import { priorityLabel, statusLabel } from '../lib/labels';

const statusStyles: Record<TicketStatus, string> = {
    ABERTO: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    EM_ANDAMENTO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    RESOLVIDO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    FECHADO: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const priorityStyles: Record<TicketPriority, string> = {
    URGENTE: 'bg-red-50 text-red-700 ring-red-600/20',
    ALTA: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    MEDIA: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
    BAIXA: 'bg-slate-50 text-slate-600 ring-slate-500/20',
};

const priorityDot: Record<TicketPriority, string> = {
    URGENTE: 'bg-red-500',
    ALTA: 'bg-orange-500',
    MEDIA: 'bg-yellow-500',
    BAIXA: 'bg-slate-400',
};

const base = 'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap';

export function StatusBadge({ status }: { status: TicketStatus }) {
    return <span className={`${base} ${statusStyles[status]}`}>{statusLabel[status] ?? status}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
    return (
        <span className={`${base} ${priorityStyles[priority]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
            {priorityLabel[priority] ?? priority}
        </span>
    );
}
