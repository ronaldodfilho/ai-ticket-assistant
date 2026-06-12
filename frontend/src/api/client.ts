import axios from 'axios';
import type {
    Classification, DashboardStats, Interaction, InteractionAuthor, NewTicket, SystemInfo, Ticket, TicketStatus,
} from './types';

// Em desenvolvimento o Vite faz proxy de /api para o backend (veja vite.config.ts).
// Em produção, defina VITE_API_URL com a URL completa da API.
const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
});

export const api = {
    systemInfo: () => http.get<SystemInfo>('/system/info').then(r => r.data),
    stats: () => http.get<DashboardStats>('/dashboard/stats').then(r => r.data),
    listTickets: () => http.get<Ticket[]>('/tickets').then(r => r.data),
    getTicket: (id: string) => http.get<Ticket>(`/tickets/${id}`).then(r => r.data),
    createTicket: (data: NewTicket) => http.post<Ticket>('/tickets', data).then(r => r.data),
    updateStatus: (id: string, status: TicketStatus) =>
        http.patch<Ticket>(`/tickets/${id}/status`, { status }).then(r => r.data),
    updateClassification: (id: string, data: Classification) =>
        http.patch<Ticket>(`/tickets/${id}/classification`, data).then(r => r.data),
    listInteractions: (id: string) => http.get<Interaction[]>(`/tickets/${id}/interactions`).then(r => r.data),
    addInteraction: (id: string, message: string, author: InteractionAuthor, authorName?: string) =>
        http.post<Interaction>(`/tickets/${id}/interactions`, { message, author, authorName }).then(r => r.data),
    summary: (id: string) => http.get<{ summary: string }>(`/tickets/${id}/summary`).then(r => r.data.summary),
    suggestion: (id: string) =>
        http.get<{ suggestion: string }>(`/tickets/${id}/suggest-response`).then(r => r.data.suggestion),
};

export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
        if (error.response.status === 404) return 'Chamado não encontrado.';
        const detail = error.response.data?.detail;
        if (typeof detail === 'string' && detail) return detail;
    }
    return fallback;
}
