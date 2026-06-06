import axios from 'axios';

// Em dev o Vite faz proxy de /api para o backend (veja vite.config.ts).
// Em produção, defina VITE_API_URL com a URL completa da API.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string' && detail) return detail;
        if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
    }
    return fallback;
}
