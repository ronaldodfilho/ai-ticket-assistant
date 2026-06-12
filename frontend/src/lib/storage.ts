// Preferências guardadas só no navegador. O acesso ao localStorage pode falhar
// (modo privado, bloqueio de cookies), então toda leitura e escrita é protegida.

const MY_TICKETS_KEY = 'ai-ticket:meus-chamados';
const ATTENDANT_KEY = 'ai-ticket:atendente';

function read<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // sem persistência: segue funcionando só na sessão atual
    }
}

export interface SavedTicket {
    id: string;
    title: string;
    createdAt: string;
}

export const myTickets = {
    list: () => read<SavedTicket[]>(MY_TICKETS_KEY, []),
    add: (ticket: SavedTicket) => {
        const others = myTickets.list().filter(t => t.id !== ticket.id);
        write(MY_TICKETS_KEY, [ticket, ...others].slice(0, 10));
    },
};

export const attendantName = {
    get: () => read<string>(ATTENDANT_KEY, ''),
    set: (name: string) => write(ATTENDANT_KEY, name),
};
