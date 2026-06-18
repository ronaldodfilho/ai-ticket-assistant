import { ArrowLeft, Bot, Loader2, RefreshCw, Save, Wand2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client';
import type { Classification, Ticket, TicketStatus } from '../../api/types';
import { PriorityBadge, StatusBadge } from '../../components/Badges';
import { ChatThread } from '../../components/ChatThread';
import { Composer } from '../../components/Composer';
import { CopyButton } from '../../components/CopyButton';
import { ErrorState, InlineError, LoadingRegion, Skeleton } from '../../components/States';
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

    if (loading) {
        return (
            <LoadingRegion label="Carregando chamado">
                <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="card space-y-4 p-5">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-20 w-3/4" />
                        <Skeleton className="ml-auto h-20 w-2/3" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                </div>
            </LoadingRegion>
        );
    }
    if (!data) {
        return (
            <div className="p-4 sm:p-8">
                <div className="card mx-auto max-w-xl">
                    <ErrorState message={error ?? 'Chamado não encontrado.'} action={<Link to="/atendimento" className="btn-secondary">Voltar à fila</Link>} />
                </div>
            </div>
        );
    }

    const { ticket, interactions } = data;
    const updateTicket = (updated: Ticket) => setData({ ticket: updated, interactions });

    return (
        <div className="mx-auto grid max-w-7xl items-start gap-6 p-4 sm:p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-labelledby="ticket-title" className="card flex h-[80dvh] min-h-[32rem] flex-col overflow-hidden xl:sticky xl:top-8 xl:h-[calc(100dvh-4rem)]">
                <header className="flex items-start gap-2 border-b border-border p-3 sm:p-4">
                    <Link to="/atendimento" className="btn-ghost btn-icon shrink-0" aria-label="Voltar à fila">
                        <ArrowLeft size={18} aria-hidden="true" />
                    </Link>
                    <div className="min-w-0 flex-1 py-1">
                        <h1 id="ticket-title" className="text-lg font-bold text-balance text-foreground">{ticket.title}</h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{ticket.userName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-xs">#{shortId(ticket.id)}</span>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} reason={ticket.priorityReason} />
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6">
                    <ChatThread interactions={interactions} viewer="ATTENDANT" />
                </div>

                <Composer
                    value={draft}
                    onChange={setDraft}
                    label="Resposta ao cliente"
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

            <aside className="space-y-6" aria-label="Detalhes e ações do chamado">
                <SummaryPanel ticketId={ticket.id} version={`${interactions.length}|${ticket.updatedAt}`} />
                <StatusPanel ticket={ticket} onUpdated={updateTicket} />
                <ClassificationPanel ticket={ticket} onUpdated={updateTicket} />
                <Panel title="Detalhes">
                    <dl className="space-y-3 text-sm">
                        <Detail label="Cliente" value={ticket.userName} />
                        <Detail label="Aberto em" value={formatDateTime(ticket.createdAt)} />
                        <Detail label="Última atividade" value={formatRelative(ticket.updatedAt)} />
                        <div>
                            <dt className="text-xs font-semibold text-muted-foreground">Protocolo</dt>
                            <dd className="flex items-center justify-between gap-2">
                                <span className="break-anywhere font-mono text-xs text-foreground">{ticket.id}</span>
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
            <div className="mb-4 flex min-h-10 items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">{icon}{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
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
                aria-busy={loading}
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
                className="btn bg-primary-soft px-3 text-primary-active hover:bg-primary-soft-hover"
            >
                {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
                {loading ? 'Gerando sugestão...' : 'Sugerir resposta'}
            </button>
            {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
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
            icon={<Bot size={16} className="text-primary" aria-hidden="true" />}
            action={
                <button onClick={generate} disabled={loading} aria-busy={loading} className="btn-ghost px-3 text-primary-active">
                    {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : summary && <RefreshCw size={14} aria-hidden="true" />}
                    {summary ? 'Atualizar' : 'Gerar resumo'}
                </button>
            }
        >
            <div aria-live="polite">
                <InlineError message={error} />
                {summary ? (
                    <>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{summary}</p>
                        {outdated && <p className="mt-2 text-xs font-semibold text-amber-800">O chamado mudou desde este resumo.</p>}
                    </>
                ) : (
                    !error && <p className="text-sm text-muted-foreground">Gere um resumo do histórico para entender o caso rapidamente.</p>
                )}
            </div>
            {info && !info.aiEnabled && <p className="mt-3 text-xs text-muted-foreground">Modo local: resumo montado a partir dos dados do chamado.</p>}
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
            <div role="group" aria-label="Alterar status" className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => {
                    const current = s === ticket.status;
                    return (
                        <button
                            key={s}
                            disabled={saving}
                            onClick={() => !current && change(s)}
                            aria-pressed={current}
                            className={`btn px-2 text-xs ${current
                                ? 'cursor-default bg-primary text-on-primary'
                                : 'border border-border-strong bg-card text-foreground hover:bg-subtle'}`}
                        >
                            {statusLabel[s]}
                        </button>
                    );
                })}
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
                <SelectField id="category" label="Categoria" value={form.category} onChange={v => setForm({ ...form, category: v as Classification['category'] })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel[c]}</option>)}
                </SelectField>
                <SelectField id="priority" label="Prioridade" value={form.priority} onChange={v => setForm({ ...form, priority: v as Classification['priority'] })}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                </SelectField>
                <SelectField id="department" label="Setor" value={form.department} onChange={v => setForm({ ...form, department: v as Classification['department'] })}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{departmentLabel[d]}</option>)}
                </SelectField>
                {ticket.priorityReason && (
                    <p className="rounded-lg bg-subtle px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Motivo da prioridade: </span>
                        {ticket.priorityReason}
                    </p>
                )}
                <InlineError message={error} />
                {dirty && (
                    <button onClick={save} disabled={saving} className="btn-primary w-full">
                        {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />} Salvar classificação
                    </button>
                )}
            </div>
        </Panel>
    );
}

function SelectField({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
            <select id={id} value={value} onChange={e => onChange(e.target.value)} className="input cursor-pointer">
                {children}
            </select>
        </div>
    );
}
