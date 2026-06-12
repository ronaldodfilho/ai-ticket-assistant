import type { TicketCategory, TicketDepartment, TicketPriority, TicketStatus } from '../api/types';

export const STATUSES: TicketStatus[] = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'FECHADO'];
export const PRIORITIES: TicketPriority[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];
export const CATEGORIES: TicketCategory[] = ['FISCAL', 'TI', 'RH', 'FINANCEIRO', 'SISTEMA', 'OUTROS'];
export const DEPARTMENTS: TicketDepartment[] = ['SUPORTE_N1', 'SUPORTE_ERP', 'INFRAESTRUTURA', 'RH', 'FINANCEIRO'];

export const statusLabel: Record<TicketStatus, string> = {
    ABERTO: 'Aberto',
    EM_ANDAMENTO: 'Em andamento',
    RESOLVIDO: 'Resolvido',
    FECHADO: 'Fechado',
};

export const priorityLabel: Record<TicketPriority, string> = {
    BAIXA: 'Baixa',
    MEDIA: 'Média',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
};

export const categoryLabel: Record<TicketCategory, string> = {
    FISCAL: 'Fiscal',
    TI: 'TI',
    RH: 'RH',
    FINANCEIRO: 'Financeiro',
    SISTEMA: 'Sistema',
    OUTROS: 'Outros',
};

export const departmentLabel: Record<TicketDepartment, string> = {
    SUPORTE_N1: 'Suporte N1',
    SUPORTE_ERP: 'Suporte ERP',
    INFRAESTRUTURA: 'Infraestrutura',
    RH: 'RH',
    FINANCEIRO: 'Financeiro',
};

/** Ordem de atendimento: prioridades mais altas primeiro. */
export const priorityRank: Record<TicketPriority, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
