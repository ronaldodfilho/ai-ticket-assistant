export type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type TicketCategory = 'FISCAL' | 'TI' | 'RH' | 'FINANCEIRO' | 'SISTEMA' | 'OUTROS';
export type TicketDepartment = 'SUPORTE_N1' | 'SUPORTE_ERP' | 'INFRAESTRUTURA' | 'RH' | 'FINANCEIRO';
export type InteractionAuthor = 'USER' | 'ATTENDANT' | 'SYSTEM_AI';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    department: TicketDepartment;
    userName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Interaction {
    id: string;
    ticketId: string;
    author: InteractionAuthor;
    authorName: string;
    message: string;
    createdAt: string;
}

export interface DashboardStats {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
}

export interface SystemInfo {
    aiEnabled: boolean;
    aiModel: string;
}

export interface NewTicket {
    title: string;
    description: string;
    userName: string;
}

export interface Classification {
    category: TicketCategory;
    priority: TicketPriority;
    department: TicketDepartment;
}
