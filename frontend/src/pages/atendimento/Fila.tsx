import { CheckCircle2, ChevronRight, CircleDot, Clock, Inbox, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../api/types';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { EmptyState, ErrorState, LoadingRegion, Skeleton } from '../../components/States';
import { usePolling } from '../../hooks/usePolling';
import { formatRelative, shortId } from '../../lib/format';
import { CATEGORIES, PRIORITIES, STATUSES, categoryLabel, departmentLabel, priorityLabel, priorityRank, statusLabel } from '../../lib/labels';

type StatusFilter = TicketStatus | 'ATIVOS' | 'TODOS';

export default function Fila() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ATIVOS');
    const [priority, setPriority] = useState<TicketPriority | ''>('');
    const [category, setCategory] = useState<TicketCategory | ''>('');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

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
    const filtersActive = statusFilter !== 'ATIVOS' || !!priority || !!category || !!search;
    const clearFilters = () => {
        setStatusFilter('ATIVOS');
        setPriority('');
        setCategory('');
        setSearch('');
    };

    const refresh = async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
    };

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Fila de chamados</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Ordenada por prioridade e, dentro dela, pelos mais antigos.</p>
                </div>
                <button onClick={refresh} disabled={refreshing} className="btn-secondary">
                    <RefreshCw size={16} className={refreshing ? 'motion-safe:animate-spin' : ''} aria-hidden="true" /> Atualizar
                </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Abertos" value={stats?.openTickets} icon={<CircleDot size={18} />} tone="text-sky-700 bg-sky-50" active={statusFilter === 'ABERTO'} onClick={() => setStatusFilter('ABERTO')} />
                <StatCard label="Em andamento" value={stats?.inProgressTickets} icon={<Clock size={18} />} tone="text-amber-700 bg-amber-50" active={statusFilter === 'EM_ANDAMENTO'} onClick={() => setStatusFilter('EM_ANDAMENTO')} />
                <StatCard label="Resolvidos" value={stats?.resolvedTickets} icon={<CheckCircle2 size={18} />} tone="text-emerald-700 bg-emerald-50" active={statusFilter === 'RESOLVIDO'} onClick={() => setStatusFilter('RESOLVIDO')} />
                <StatCard label="Total" value={stats?.totalTickets} icon={<Inbox size={18} />} tone="text-muted-foreground bg-subtle" active={statusFilter === 'TODOS'} onClick={() => setStatusFilter('TODOS')} />
            </div>

            <section className="card overflow-hidden" aria-labelledby="lista-titulo">
                <h2 id="lista-titulo" className="sr-only">Chamados</h2>
                <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <label htmlFor="busca" className="sr-only">Buscar chamados</label>
                        <input id="busca" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por assunto, cliente ou protocolo" className="input pl-9" />
                    </div>
                    <FilterSelect label="Status" value={statusFilter} onChange={v => setStatusFilter(v as StatusFilter)}>
                        <option value="ATIVOS">Ativos</option>
                        <option value="TODOS">Todos os status</option>
                        {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </FilterSelect>
                    <FilterSelect label="Prioridade" value={priority} onChange={v => setPriority(v as TicketPriority | '')}>
                        <option value="">Todas as prioridades</option>
                        {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                    </FilterSelect>
                    <FilterSelect label="Categoria" value={category} onChange={v => setCategory(v as TicketCategory | '')}>
                        <option value="">Todas as categorias</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                    </FilterSelect>
                </div>

                {loading ? (
                    <LoadingRegion label="Carregando chamados">
                        <div className="divide-y divide-border">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 px-4 py-4">
                                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-24" /></div>
                                    <Skeleton className="hidden h-5 w-20 md:block" />
                                    <Skeleton className="hidden h-5 w-24 md:block" />
                                </div>
                            ))}
                        </div>
                    </LoadingRegion>
                ) : !data ? (
                    <ErrorState message={error ?? 'Erro ao carregar.'} action={<button onClick={refresh} className="btn-secondary">Tentar de novo</button>} />
                ) : (
                    <>
                        <p className="sr-only" role="status">{tickets.length} {tickets.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}</p>
                        {tickets.length === 0 ? (
                            <EmptyState
                                icon={<Inbox size={22} />}
                                title={filtersActive ? 'Nenhum chamado com esses filtros' : 'Nenhum chamado ativo'}
                                description={filtersActive ? undefined : 'Chamados abertos no portal do cliente aparecem aqui.'}
                                action={filtersActive
                                    ? <button className="btn-secondary" onClick={clearFilters}>Limpar filtros</button>
                                    : <Link to="/" className="btn-secondary">Abrir portal do cliente</Link>}
                            />
                        ) : (
                            <>
                                <TicketTable tickets={tickets} />
                                <TicketCards tickets={tickets} />
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

function TicketTable({ tickets }: { tickets: Ticket[] }) {
    const navigate = useNavigate();
    return (
        <div className="hidden md:block">
            <table className="w-full text-left text-sm">
                <thead className="bg-subtle text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <tr>
                        <th scope="col" className="px-4 py-3">Chamado</th>
                        <th scope="col" className="px-4 py-3">Cliente</th>
                        <th scope="col" className="px-4 py-3">Prioridade</th>
                        <th scope="col" className="px-4 py-3">Categoria / setor</th>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3">Atualizado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {tickets.map(t => (
                        <tr key={t.id} onClick={() => navigate(`/atendimento/chamados/${t.id}`)} className="cursor-pointer transition-colors duration-150 hover:bg-primary-soft/50">
                            <td className="max-w-xs px-4 py-3">
                                <Link to={`/atendimento/chamados/${t.id}`} onClick={e => e.stopPropagation()} className="block truncate rounded font-semibold text-foreground hover:text-primary" title={t.title}>
                                    {t.title}
                                </Link>
                                <span className="font-mono text-xs text-muted-foreground">#{shortId(t.id)}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{t.userName}</td>
                            <td className="px-4 py-3"><PriorityBadge priority={t.priority} reason={t.priorityReason} /></td>
                            <td className="px-4 py-3 text-foreground">
                                {categoryLabel[t.category]}
                                <span className="block text-xs text-muted-foreground">{departmentLabel[t.department]}</span>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatRelative(t.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** No celular a tabela vira uma lista de cartões, sem rolagem horizontal. */
function TicketCards({ tickets }: { tickets: Ticket[] }) {
    return (
        <ul className="divide-y divide-border md:hidden">
            {tickets.map(t => (
                <li key={t.id} className="relative flex items-start gap-3 p-4 transition-colors duration-150 hover:bg-primary-soft/50">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Link to={`/atendimento/chamados/${t.id}`} className="block font-semibold text-foreground after:absolute after:inset-0">
                            {t.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                            {t.userName} · <span className="font-mono">#{shortId(t.id)}</span> · {formatRelative(t.updatedAt)}
                        </p>
                        <div className="relative z-10 flex flex-wrap items-center gap-2">
                            <PriorityBadge priority={t.priority} reason={t.priorityReason} />
                            <StatusBadge status={t.status} />
                            <span className="text-xs text-muted-foreground">{categoryLabel[t.category]} · {departmentLabel[t.department]}</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
            ))}
        </ul>
    );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
    const id = `filtro-${label.toLowerCase()}`;
    return (
        <div>
            <label htmlFor={id} className="sr-only">{label}</label>
            <select id={id} value={value} onChange={e => onChange(e.target.value)} className="input cursor-pointer lg:w-auto">
                {children}
            </select>
        </div>
    );
}

function StatCard({ label, value, icon, tone, active, onClick }: { label: string; value?: number; icon: ReactNode; tone: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`card flex cursor-pointer items-center gap-3 p-4 text-left transition-colors duration-150 hover:border-primary/40 ${active ? 'border-primary ring-1 ring-primary' : ''}`}
        >
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tone}`} aria-hidden="true">{icon}</span>
            <span>
                <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
                <span className="block text-2xl font-bold text-foreground tabular-nums">{value ?? '—'}</span>
            </span>
        </button>
    );
}
