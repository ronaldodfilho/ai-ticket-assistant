import { create } from 'zustand';
import { api } from '../api/axios';
import type { TicketCategory, TicketPriority, TicketStatus } from '../lib/labels';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    department: string;
    userName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Interaction {
    id: string;
    ticketId: string;
    author: 'USER' | 'ATTENDANT' | 'SYSTEM_AI';
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

interface TicketStore {
    tickets: Ticket[];
    loading: boolean;
    error: string | null;
    stats: DashboardStats;
    fetchTickets: () => Promise<void>;
    fetchStats: () => Promise<void>;
    createTicket: (data: { title: string; description: string; userName: string }) => Promise<Ticket>;
}

export const useTicketStore = create<TicketStore>((set) => ({
    tickets: [],
    loading: false,
    error: null,
    stats: { totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0, closedTickets: 0 },
    fetchTickets: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<Ticket[]>('/tickets');
            set({ tickets: response.data, loading: false });
        } catch (error) {
            console.error(error);
            set({ loading: false, error: 'Não foi possível carregar os chamados.' });
        }
    },
    fetchStats: async () => {
        try {
            const response = await api.get<DashboardStats>('/dashboard/stats');
            set({ stats: response.data });
        } catch (error) {
            console.error(error);
        }
    },
    createTicket: async (data) => {
        const response = await api.post<Ticket>('/tickets', data);
        return response.data;
    },
}));
