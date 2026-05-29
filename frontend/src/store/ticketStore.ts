import { create } from 'zustand';
import { api } from '../api/axios';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
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

interface TicketStore {
    tickets: Ticket[];
    loading: boolean;
    stats: any;
    fetchTickets: () => Promise<void>;
    fetchStats: () => Promise<void>;
    createTicket: (data: { title: string; description: string; userName: string }) => Promise<void>;
}

export const useTicketStore = create<TicketStore>((set) => ({
    tickets: [],
    loading: false,
    stats: { totalTickets: 0, openTickets: 0, resolvedTickets: 0, inProgressTickets: 0 },
    fetchTickets: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/tickets');
            set({ tickets: response.data, loading: false });
        } catch (error) {
            console.error(error);
            set({ loading: false });
        }
    },
    fetchStats: async () => {
        try {
            const response = await api.get('/dashboard/stats');
            set({ stats: response.data });
        } catch (error) {
            console.error(error);
        }
    },
    createTicket: async (data) => {
        try {
            await api.post('/tickets', data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}));
