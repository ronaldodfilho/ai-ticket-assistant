import { useEffect, useMemo, useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, Clock, CheckCircle2, AlertCircle, Plus, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import {
    STATUS_OPTIONS, categoryLabel, label, priorityColor, priorityLabel, statusColor, statusLabel,
    type TicketStatus,
} from '../lib/labels';

export default function Dashboard() {
    const { tickets, stats, fetchTickets, fetchStats, loading, error } = useTicketStore();
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'TODOS'>('TODOS');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const refresh = () => {
        fetchTickets();
        fetchStats();
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredTickets = useMemo(() => {
        const term = search.trim().toLowerCase();
        return tickets.filter(ticket =>
            (statusFilter === 'TODOS' || ticket.status === statusFilter) &&
            (!term || ticket.title.toLowerCase().includes(term) || ticket.userName.toLowerCase().includes(term))
        );
    }, [tickets, statusFilter, search]);

    return (
        <div className="flex-1 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Visão geral do sistema de suporte.</p>
                    </div>
                    <Link
                        to="/"
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-brand-500/20 text-sm flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Novo Chamado
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<TicketIcon />} title="Total de Chamados" value={stats.totalTickets} color="blue" />
                    <StatCard icon={<AlertCircle />} title="Abertos" value={stats.openTickets} color="red" />
                    <StatCard icon={<Clock />} title="Em Andamento" value={stats.inProgressTickets} color="yellow" />
                    <StatCard icon={<CheckCircle2 />} title="Resolvidos" value={stats.resolvedTickets} color="green" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Chamados Recentes</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar título ou solicitante"
                                    className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-brand-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as TicketStatus | 'TODOS')}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand-500"
                            >
                                <option value="TODOS">Todos os status</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                            </select>
                            <button onClick={refresh} className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                                <RefreshCw size={14} /> Atualizar
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Carregando...</div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-600">{error}</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">Nenhum chamado encontrado.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Título</th>
                                        <th className="px-6 py-4">Solicitante</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4">Prioridade</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Abertura</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTickets.map(ticket => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => navigate(`/tickets/${ticket.id}`)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{ticket.id.substring(0, 8)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{ticket.title}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{ticket.userName}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                    {label(categoryLabel, ticket.category)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityColor[ticket.priority] ?? 'bg-slate-100 text-slate-700'}`}>
                                                    {label(priorityLabel, ticket.priority)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[ticket.status]}`}>
                                                    {label(statusLabel, ticket.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        green: 'bg-green-50 text-green-600',
    }[color] || 'bg-slate-50 text-slate-600';

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}
