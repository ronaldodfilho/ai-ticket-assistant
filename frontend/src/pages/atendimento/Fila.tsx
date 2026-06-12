import { CheckCircle2, CircleDot, Clock, Inbox, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { TicketCategory, TicketPriority, TicketStatus } from '../../api/types';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { usePolling } from '../../hooks/usePolling';
import { formatRelative, shortId } from '../../lib/format';
import { CATEGORIES, PRIORITIES, STATUSES, categoryLabel, departmentLabel, priorityLabel, priorityRank, statusLabel } from '../../lib/labels';

type StatusFilter = TicketStatus | 'ATIVOS' | 'TODOS';

export default function Fila() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ATIVOS');
    const [priority, setPriority] = useState<TicketPriority | ''>('');
    const [category, setCategory] = useState<TicketCategory | ''>('');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const { data, loading, error, reload } = usePolling(
        async () => {
            const [stats, tickets] = await Promise.all([api.stats(), api.listTickets()]);
            return { stats, tickets };
        },
        15000,
    );

    const tickets = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (data?.tickets ?? [])
            .filter(t => {
                if (statusFilter === 'ATIVOS') return t.status === 'ABERTO' || t.status === 'EM_ANDAMENTO';
                return statusFilter === 'TODOS' || t.status === statusFilter;
            })
            .filter(t => !priority || t.priority === priority)
            .filter(t => !category || t.category === category)
            .filter(t => !term || [t.title, t.userName, t.id].some(v => v.toLowerCase().includes(term)))
            .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.createdAt.localeCompare(b.createdAt));
    }, [data, statusFilter, priority, category, search]);

    const stats = data?.stats;
    const filtersActive = statusFilter !== 'ATIVOS' || priority || category || search;

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Fila de chamados</h1>
                    <p className="mt-1 text-sm text-slate-500">Ordenada por prioridade e, dentro dela, pelos mais antigos.</p>
                </div>
                <button onClick={reload} className="btn-secondary">
                    <RefreshCw size={16} /> Atualizar
                </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Abertos" value={stats?.openTickets} icon={<CircleDot size={18} />} tone="text-sky-600 bg-sky-50" onClick={() => setStatusFilter('ABERTO')} />
                <StatCard label="Em andamento" value={stats?.inProgressTickets} icon={<Clock size={18} />} tone="text-amber-600 bg-amber-50" onClick={() => setStatusFilter('EM_ANDAMENTO')} />
                <StatCard label="Resolvidos" value={stats?.resolvedTickets} icon={<CheckCircle2 size={18} />} tone="text-emerald-600 bg-emerald-50" onClick={() => setStatusFilter('RESOLVIDO')} />
                <StatCard label="Total" value={stats?.totalTickets} icon={<Inbox size={18} />} tone="text-slate-600 bg-slate-100" onClick={() => setStatusFilter('TODOS')} />
            </div>

            <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
                    <div className="relative min-w-52 flex-1">
                        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por assunto, cliente ou protocolo" aria-label="Buscar" className="input pl-9" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} aria-label="Status" className="input w-auto">
                        <option value="ATIVOS">Ativos</option>
                        <option value="TODOS">Todos os status</option>
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </select>
                    <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority | '')} aria-label="Prioridade" className="input w-auto">
                        <option value="">Todas as prioridades</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                    </select>
                    <select value={category} onChange={e => setCategory(e.target.value as TicketCategory | '')} aria-label="Categoria" className="input w-auto">
                        <option value="">Todas as categorias</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                    </select>
                </div>

                {loading ? (
                    <LoadingState />
                ) : !data ? (
                    <ErrorState message={error ?? 'Erro ao carregar.'} action={<button onClick={reload} className="btn-secondary">Tentar de novo</button>} />
                ) : tickets.length === 0 ? (
                    <EmptyState
                        icon={<Inbox size={36} />}
                        title={filtersActive ? 'Nenhum chamado com esses filtros' : 'Nenhum chamado ativo'}
                        description={filtersActive ? undefined : 'Chamados abertos no portal do cliente aparecem aqui.'}
                        action={filtersActive ? (
                            <button className="btn-secondary" onClick={() => { setStatusFilter('ATIVOS'); setPriority(''); setCategory(''); setSearch(''); }}>
                                Limpar filtros
                            </button>
                        ) : (
                            <Link to="/" className="btn-secondary">Abrir portal do cliente</Link>
                        )}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Chamado</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Prioridade</th>
                                    <th className="px-4 py-3">Categoria / setor</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Atualizado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tickets.map(t => (
                                    <tr key={t.id} onClick={() => navigate(`/atendimento/chamados/${t.id}`)} className="cursor-pointer hover:bg-slate-50">
                                        <td className="max-w-xs px-4 py-3">
                                            <Link to={`/atendimento/chamados/${t.id}`} onClick={e => e.stopPropagation()} className="block truncate font-medium text-slate-900 hover:text-brand-700">
                                                {t.title}
                                            </Link>
                                            <span className="font-mono text-xs text-slate-400">#{shortId(t.id)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{t.userName}</td>
                                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {categoryLabel[t.category]}
                                            <span className="block text-xs text-slate-400">{departmentLabel[t.department]}</span>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatRelative(t.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, tone, onClick }: { label: string; value?: number; icon: ReactNode; tone: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="card flex items-center gap-3 p-4 text-left transition-colors hover:border-brand-300">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
            <span>
                <span className="block text-xs text-slate-500">{label}</span>
                <span className="block text-xl font-semibold text-slate-900 tabular-nums">{value ?? '—'}</span>
            </span>
        </button>
    );
}
