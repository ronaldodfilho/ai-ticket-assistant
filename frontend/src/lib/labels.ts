export type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type TicketCategory = 'FISCAL' | 'TI' | 'RH' | 'FINANCEIRO' | 'SISTEMA' | 'OUTROS';

export const STATUS_OPTIONS: TicketStatus[] = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO'];

export const statusLabel: Record<TicketStatus, string> = {
    ABERTO: 'Aberto',
    EM_ANDAMENTO: 'Em andamento',
    RESOLVIDO: 'Resolvido',
    FECHADO: 'Fechado',
};

export const statusColor: Record<TicketStatus, string> = {
    ABERTO: 'bg-red-50 text-red-700',
    EM_ANDAMENTO: 'bg-yellow-50 text-yellow-700',
    RESOLVIDO: 'bg-green-50 text-green-700',
    FECHADO: 'bg-slate-100 text-slate-600',
};

export const priorityLabel: Record<TicketPriority, string> = {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
};

export const priorityColor: Record<TicketPriority, string> = {
    BAIXA: 'bg-blue-100 text-blue-700',
    MEDIA: 'bg-yellow-100 text-yellow-700',
    ALTA: 'bg-orange-100 text-orange-700',
    URGENTE: 'bg-red-100 text-red-700',
};

export const categoryLabel: Record<TicketCategory, string> = {
    FISCAL: 'Fiscal',
    TI: 'TI',
    RH: 'RH',
    FINANCEIRO: 'Financeiro',
    SISTEMA: 'Sistema',
    OUTROS: 'Outros',
};

export const departmentLabel: Record<string, string> = {
    SUPORTE_N1: 'Suporte N1',
    SUPORTE_ERP: 'Suporte ERP',
    INFRAESTRUTURA: 'Infraestrutura',
    RH: 'RH',
    FINANCEIRO: 'Financeiro',
};

export const label = <K extends string>(map: Record<K, string>, value: string | null | undefined) =>
    value ? map[value as K] ?? value : '—';
