import { useEffect } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
    const { tickets, stats, fetchTickets, fetchStats, loading } = useTicketStore();

    useEffect(() => {
        fetchTickets();
        fetchStats();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch(priority) {
            case 'BAIXA': return 'bg-blue-100 text-blue-700';
            case 'MEDIA': return 'bg-yellow-100 text-yellow-700';
            case 'ALTA': return 'bg-orange-100 text-orange-700';
            case 'URGENTE': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    }

    return (
        <div className="flex-1 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Visão geral do sistema de suporte.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<TicketIcon />} title="Total de Chamados" value={stats.totalTickets} color="blue" />
                    <StatCard icon={<AlertCircle />} title="Abertos" value={stats.openTickets} color="red" />
                    <StatCard icon={<Clock />} title="Em Andamento" value={stats.inProgressTickets} color="yellow" />
                    <StatCard icon={<CheckCircle2 />} title="Resolvidos" value={stats.resolvedTickets} color="green" />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Chamados Recentes</h2>
                        <button onClick={fetchTickets} className="text-sm font-medium text-brand-600 hover:text-brand-700">Atualizar</button>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Carregando...</div>
                    ) : tickets.length === 0 ? (
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                                <Link to={`/tickets/${ticket.id}`} className="hover:text-brand-600 hover:underline">
                                                    #{ticket.id.substring(0,8)}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">{ticket.title}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{ticket.userName}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                    {ticket.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{ticket.status}</td>
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
