import { ArrowLeft, Bot, Loader2, Save, Wand2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client';
import type { Classification, Ticket, TicketStatus } from '../../api/types';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { ChatThread } from '../../components/ChatThread';
import { Composer } from '../../components/Composer';
import { CopyButton } from '../../components/CopyButton';
import { ErrorState, InlineError, LoadingState } from '../../components/States';
import { usePolling } from '../../hooks/usePolling';
import { useSystemInfo } from '../../hooks/useSystemInfo';
import { formatDateTime, formatRelative, shortId } from '../../lib/format';
import { CATEGORIES, DEPARTMENTS, PRIORITIES, STATUSES, categoryLabel, departmentLabel, priorityLabel, statusLabel } from '../../lib/labels';
import { attendantName } from '../../lib/storage';

export default function ChamadoAtendente() {
    const { id = '' } = useParams();
    const [draft, setDraft] = useState('');
    const { data, loading, error, reload, setData } = usePolling(
        async () => {
            const [ticket, interactions] = await Promise.all([api.getTicket(id), api.listInteractions(id)]);
            return { ticket, interactions };
        },
        8000,
        id,
    );

    if (loading) return <LoadingState label="Carregando chamado..." />;
    if (!data) {
        return <ErrorState message={error ?? 'Chamado não encontrado.'} action={<Link to="/atendimento" className="btn-secondary">Voltar à fila</Link>} />;
    }

    const { ticket, interactions } = data;
    const updateTicket = (updated: Ticket) => setData({ ticket: updated, interactions });

    return (
        <div className="mx-auto grid max-w-7xl items-start gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[1fr_340px]">
            <section className="card flex h-[80vh] min-h-[32rem] flex-col overflow-hidden xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)]">
                <header className="flex flex-wrap items-start gap-3 border-b border-slate-200 p-4 sm:p-5">
                    <Link to="/atendimento" className="btn-ghost -ml-1 px-2" aria-label="Voltar à fila">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-semibold text-slate-900">{ticket.title}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span>{ticket.userName}</span>
                            <span>·</span>
                            <span className="font-mono">#{shortId(ticket.id)}</span>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                    <ChatThread interactions={interactions} viewer="ATTENDANT" />
                </div>

                <Composer
                    value={draft}
                    onChange={setDraft}
                    placeholder="Responder ao cliente..."
                    disabled={ticket.status === 'FECHADO'}
                    disabledReason="Chamado fechado. Reabra alterando o status para responder."
                    toolbar={<SuggestButton ticketId={ticket.id} onSuggestion={setDraft} />}
                    onSend={async message => {
                        await api.addInteraction(ticket.id, message, 'ATTENDANT', attendantName.get() || undefined);
                        await reload();
                    }}
                />
            </section>

            <aside className="space-y-6">
                <SummaryPanel ticketId={ticket.id} version={`${interactions.length}|${ticket.updatedAt}`} />
                <StatusPanel ticket={ticket} onUpdated={updateTicket} />
                <ClassificationPanel ticket={ticket} onUpdated={updateTicket} />
                <Panel title="Detalhes">
                    <dl className="space-y-3 text-sm">
                        <Detail label="Cliente" value={ticket.userName} />
                        <Detail label="Aberto em" value={formatDateTime(ticket.createdAt)} />
                        <Detail label="Última atividade" value={formatRelative(ticket.updatedAt)} />
                        <div>
                            <dt className="text-xs text-slate-500">Protocolo</dt>
                            <dd className="flex items-center justify-between gap-2">
                                <span className="truncate font-mono text-xs text-slate-700">{ticket.id}</span>
                                <CopyButton text={ticket.id} />
                            </dd>
                        </div>
                    </dl>
                </Panel>
            </aside>
        </div>
    );
}

function Panel({ title, icon, children, action }: { title: string; icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
    return (
        <section className="card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">{icon}{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-slate-800">{value}</dd>
        </div>
    );
}

function SuggestButton({ ticketId, onSuggestion }: { ticketId: string; onSuggestion: (text: string) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                disabled={loading}
                onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                        onSuggestion(await api.suggestion(ticketId));
                    } catch (err) {
                        setError(getErrorMessage(err, 'Não foi possível gerar a sugestão.'));
                    } finally {
                        setLoading(false);
                    }
                }}
                className="btn border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-700 hover:bg-brand-100"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {loading ? 'Gerando sugestão...' : 'Sugerir resposta'}
            </button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
}

function SummaryPanel({ ticketId, version }: { ticketId: string; version: string }) {
    const info = useSystemInfo();
    const [summary, setSummary] = useState<string | null>(null);
    const [summaryVersion, setSummaryVersion] = useState(version);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            setSummary(await api.summary(ticketId));
            setSummaryVersion(version);
        } catch (err) {
            setError(getErrorMessage(err, 'Não foi possível gerar o resumo.'));
        } finally {
            setLoading(false);
        }
    };

    const outdated = summary !== null && version !== summaryVersion;

    return (
        <Panel
            title="Resumo do chamado"
            icon={<Bot size={16} className="text-brand-600" />}
            action={
                <button onClick={generate} disabled={loading} className="btn-ghost px-2 py-1 text-xs text-brand-700">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {summary ? 'Atualizar' : 'Gerar'}
                </button>
            }
        >
            <InlineError message={error} />
            {summary ? (
                <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{summary}</p>
                    {outdated && <p className="mt-2 text-xs text-amber-700">O chamado mudou desde este resumo.</p>}
                </>
            ) : (
                !error && <p className="text-sm text-slate-500">Gere um resumo do histórico para entender o caso rapidamente.</p>
            )}
            {info && !info.aiEnabled && <p className="mt-3 text-xs text-slate-400">Modo local: resumo montado a partir dos dados do chamado.</p>}
        </Panel>
    );
}

function StatusPanel({ ticket, onUpdated }: { ticket: Ticket; onUpdated: (t: Ticket) => void }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const change = async (status: TicketStatus) => {
        setSaving(true);
        setError(null);
        try {
            onUpdated(await api.updateStatus(ticket.id, status));
        } catch (err) {
            setError(getErrorMessage(err, 'Não foi possível alterar o status.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Panel title="Status">
            <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        disabled={saving || s === ticket.status}
                        onClick={() => change(s)}
                        aria-pressed={s === ticket.status}
                        className={`btn px-2 py-1.5 text-xs disabled:cursor-default ${
                            s === ticket.status
                                ? 'bg-brand-600 text-white disabled:opacity-100'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {statusLabel[s]}
                    </button>
                ))}
            </div>
            <div className="mt-3"><InlineError message={error} /></div>
        </Panel>
    );
}

function ClassificationPanel({ ticket, onUpdated }: { ticket: Ticket; onUpdated: (t: Ticket) => void }) {
    const [form, setForm] = useState<Classification>({ category: ticket.category, priority: ticket.priority, department: ticket.department });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mantém o formulário em dia quando o chamado é atualizado por fora
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({ category: ticket.category, priority: ticket.priority, department: ticket.department });
    }, [ticket.category, ticket.priority, ticket.department]);

    const dirty = form.category !== ticket.category || form.priority !== ticket.priority || form.department !== ticket.department;

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            onUpdated(await api.updateClassification(ticket.id, form));
        } catch (err) {
            setError(getErrorMessage(err, 'Não foi possível salvar a classificação.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Panel title="Classificação">
            <div className="space-y-3">
                <div>
                    <label htmlFor="category" className="label text-xs">Categoria</label>
                    <select id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Classification['category'] })} className="input">
                        {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="priority" className="label text-xs">Prioridade</label>
                    <select id="priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Classification['priority'] })} className="input">
                        {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="department" className="label text-xs">Setor</label>
                    <select id="department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value as Classification['department'] })} className="input">
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{departmentLabel[d]}</option>)}
                    </select>
                </div>
                <InlineError message={error} />
                {dirty && (
                    <button onClick={save} disabled={saving} className="btn-primary w-full">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar classificação
                    </button>
                )}
            </div>
        </Panel>
    );
}
