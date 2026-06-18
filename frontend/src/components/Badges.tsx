import { CheckCircle2, CircleDot, Clock, Lock } from 'lucide-react';
import type { TicketPriority, TicketStatus } from '../api/types';
import { priorityLabel, statusLabel } from '../lib/labels';
import { Tooltip } from './Tooltip';

const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap';

const statusStyles: Record<TicketStatus, string> = {
    ABERTO: 'bg-sky-50 text-sky-800 ring-sky-600/25',
    EM_ANDAMENTO: 'bg-amber-50 text-amber-800 ring-amber-600/25',
    RESOLVIDO: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25',
    FECHADO: 'bg-subtle text-muted-foreground ring-slate-500/25',
};

// Ícone junto da cor: o status não depende só da cor para ser entendido
const statusIcons = { ABERTO: CircleDot, EM_ANDAMENTO: Clock, RESOLVIDO: CheckCircle2, FECHADO: Lock } as const;

const priorityStyles: Record<TicketPriority, string> = {
    URGENTE: 'bg-red-50 text-red-800 ring-red-600/25',
    ALTA: 'bg-orange-50 text-orange-800 ring-orange-600/25',
    MEDIA: 'bg-yellow-50 text-yellow-900 ring-yellow-600/30',
    BAIXA: 'bg-subtle text-muted-foreground ring-slate-500/25',
    INDEFINIDA: 'bg-violet-50 text-violet-800 ring-violet-600/25',
};

const priorityDot: Record<TicketPriority, string> = {
    URGENTE: 'bg-red-600',
    ALTA: 'bg-orange-500',
    MEDIA: 'bg-yellow-500',
    BAIXA: 'bg-slate-400',
    INDEFINIDA: 'bg-violet-500',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
    const Icon = statusIcons[status];
    return (
        <span className={`${base} ${statusStyles[status]}`}>
            <Icon size={12} aria-hidden="true" />
            {statusLabel[status] ?? status}
        </span>
    );
}

export function PriorityBadge({ priority, reason }: { priority: TicketPriority; reason?: string | null }) {
    const badge = (
        <span className={`${base} ${priorityStyles[priority]}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${priorityDot[priority]}`} />
            {priorityLabel[priority] ?? priority}
        </span>
    );
    if (!reason) return badge;

    return (
        <Tooltip
            label={`Prioridade ${priorityLabel[priority]}. Ver motivo`}
            content={
                <>
                    <span className="mb-0.5 block font-semibold">Por que {priorityLabel[priority] ?? priority}?</span>
                    {reason}
                </>
            }
        >
            {badge}
        </Tooltip>
    );
}
