import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, Loader2, MessageSquareText, Search, Send, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client';
import type { Ticket } from '../../api/types';
import { PriorityBadge } from '../../components/Badges';
import { CopyButton } from '../../components/CopyButton';
import { InlineError } from '../../components/States';
import { formatRelative, shortId } from '../../lib/format';
import { categoryLabel, departmentLabel } from '../../lib/labels';
import { myTickets } from '../../lib/storage';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Field = 'userName' | 'title' | 'description';
type Errors = Partial<Record<Field, string>>;

const LIMITS: Record<Field, number> = { userName: 100, title: 150, description: 5000 };
const FIELD_LABELS: Record<Field, string> = { userName: 'Seu nome', title: 'Assunto', description: 'Descrição' };
const SERVER_FIELDS: Record<string, Field> = { userName: 'userName', title: 'title', description: 'description' };

function validate(field: Field, value: string): string | undefined {
    if (!value.trim()) return `Preencha o campo ${FIELD_LABELS[field].toLowerCase()}.`;
    if (value.length > LIMITS[field]) return `Use no máximo ${LIMITS[field]} caracteres.`;
    return undefined;
}

/** Converte "title: mensagem; description: mensagem" (400 da API) em erros por campo. */
function parseServerErrors(detail: string): Errors {
    const errors: Errors = {};
    for (const part of detail.split(';')) {
        const [key, ...rest] = part.split(':');
        const field = SERVER_FIELDS[key?.trim()];
        if (field && rest.length) errors[field] = rest.join(':').trim();
    }
    return errors;
}

export default function NovoChamado() {
    const [values, setValues] = useState<Record<Field, string>>({ userName: '', title: '', description: '' });
    const [errors, setErrors] = useState<Errors>({});
    const [summaryVisible, setSummaryVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestError, setRequestError] = useState<string | null>(null);
    const [created, setCreated] = useState<Ticket | null>(null);
    const [saved, setSaved] = useState(myTickets.list());
    const summaryRef = useRef<HTMLDivElement>(null);

    const update = (field: Field, value: string) => {
        setValues(v => ({ ...v, [field]: value }));
        // Depois de um erro, revalida enquanto a pessoa corrige
        if (errors[field]) setErrors(e => ({ ...e, [field]: validate(field, value) }));
    };

    const showSummary = (found: Errors) => {
        setErrors(found);
        setSummaryVisible(true);
        requestAnimationFrame(() => summaryRef.current?.focus());
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const found: Errors = {};
        (Object.keys(values) as Field[]).forEach(f => {
            const error = validate(f, values[f]);
            if (error) found[f] = error;
        });
        if (Object.keys(found).length) return showSummary(found);

        setSubmitting(true);
        setRequestError(null);
        setSummaryVisible(false);
        try {
            const ticket = await api.createTicket(values);
            myTickets.add({ id: ticket.id, title: ticket.title, createdAt: ticket.createdAt });
            setSaved(myTickets.list());
            setCreated(ticket);
            setValues(v => ({ ...v, title: '', description: '' }));
            setErrors({});
            window.scrollTo({ top: 0 });
        } catch (err) {
            const message = getErrorMessage(err, 'Não foi possível abrir o chamado. Tente novamente.');
            const serverErrors = parseServerErrors(message);
            if (Object.keys(serverErrors).length) showSummary(serverErrors);
            else setRequestError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const errorEntries = Object.entries(errors).filter(([, v]) => v) as [Field, string][];

    return (
        <>
            <section className="border-b border-border bg-card">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                    <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-active">
                        <Sparkles size={14} aria-hidden="true" /> Triagem automática por IA
                    </p>
                    <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
                        Como podemos ajudar?
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        Conte o que aconteceu. O chamado é classificado na hora e vai direto para a equipe certa.
                    </p>
                    <ol className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                        <Step icon={<MessageSquareText size={18} />} title="Descreva o problema" text="Quanto mais detalhes, mais rápida a solução." />
                        <Step icon={<Sparkles size={18} />} title="A IA faz a triagem" text="Categoria, prioridade e setor definidos." />
                        <Step icon={<Users size={18} />} title="Acompanhe a conversa" text="Responda o suporte pelo protocolo." />
                    </ol>
                </div>
            </section>

            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section aria-labelledby="form-title">
                    {created ? (
                        <CreatedCard ticket={created} onNew={() => setCreated(null)} />
                    ) : (
                        <form onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-7">
                            <h2 id="form-title" className="text-lg font-bold text-foreground">Abrir chamado</h2>

                            {summaryVisible && errorEntries.length > 0 && (
                                <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="rounded-lg border border-destructive/30 bg-destructive-soft p-4 outline-none focus:ring-3 focus:ring-destructive/20">
                                    <p id="error-summary-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                                        <AlertCircle size={16} aria-hidden="true" /> Corrija {errorEntries.length === 1 ? 'o campo' : 'os campos'} abaixo:
                                    </p>
                                    <ul className="ml-6 list-disc space-y-1 text-sm text-red-800">
                                        {errorEntries.map(([field, message]) => (
                                            <li key={field}>
                                                <a href={`#${field}`} className="underline underline-offset-2" onClick={e => { e.preventDefault(); document.getElementById(field)?.focus(); }}>
                                                    {FIELD_LABELS[field]}: {message}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <FormField id="userName" label="Seu nome" error={errors.userName}>
                                <input id="userName" name="name" autoComplete="name" maxLength={LIMITS.userName} value={values.userName}
                                    onChange={e => update('userName', e.target.value)} onBlur={e => setErrors(er => ({ ...er, userName: validate('userName', e.target.value) }))}
                                    aria-invalid={!!errors.userName} aria-describedby={errors.userName ? 'userName-error' : undefined}
                                    placeholder="Ex.: Maria Souza" className="input" />
                            </FormField>

                            <FormField id="title" label="Assunto" error={errors.title}>
                                <input id="title" maxLength={LIMITS.title} value={values.title}
                                    onChange={e => update('title', e.target.value)} onBlur={e => setErrors(er => ({ ...er, title: validate('title', e.target.value) }))}
                                    aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined}
                                    placeholder="Ex.: Erro ao emitir nota fiscal no ERP" className="input" />
                            </FormField>

                            <FormField
                                id="description"
                                label="Descrição"
                                error={errors.description}
                                hint={<span className="tabular-nums">{values.description.length}/{LIMITS.description}</span>}
                            >
                                <textarea id="description" rows={6} maxLength={LIMITS.description} value={values.description}
                                    onChange={e => update('description', e.target.value)} onBlur={e => setErrors(er => ({ ...er, description: validate('description', e.target.value) }))}
                                    aria-invalid={!!errors.description} aria-describedby={`description-help${errors.description ? ' description-error' : ''}`}
                                    placeholder="O que aconteceu, desde quando, qual mensagem de erro apareceu e quem está sendo afetado."
                                    className="input resize-y leading-relaxed" />
                                <p id="description-help" className="mt-1.5 text-xs text-muted-foreground">
                                    Informe o sistema ou equipamento, a mensagem de erro e quantas pessoas foram afetadas.
                                </p>
                            </FormField>

                            <InlineError message={requestError} />

                            <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground">A classificação leva alguns segundos.</p>
                                <button type="submit" disabled={submitting} className="btn-accent px-6">
                                    {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                                    {submitting ? 'Classificando e enviando...' : 'Abrir chamado'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                <aside className="space-y-6" aria-label="Acompanhamento">
                    <TrackByProtocol />
                    <section className="card p-5" aria-labelledby="my-tickets">
                        <h2 id="my-tickets" className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                            <ClipboardList size={16} aria-hidden="true" /> Meus chamados
                        </h2>
                        {saved.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Os chamados abertos neste navegador aparecem aqui.</p>
                        ) : (
                            <ul className="-mx-2 space-y-0.5">
                                {saved.map(ticket => (
                                    <li key={ticket.id}>
                                        <Link to={`/chamados/${ticket.id}`} className="flex min-h-11 flex-col justify-center rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-subtle">
                                            <span className="truncate text-sm font-semibold text-foreground">{ticket.title}</span>
                                            <span className="text-xs text-muted-foreground">#{shortId(ticket.id)} · {formatRelative(ticket.createdAt)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </aside>
            </div>
        </>
    );
}

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <li className="flex gap-3 rounded-xl border border-border bg-background p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary" aria-hidden="true">{icon}</span>
            <span>
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{text}</span>
            </span>
        </li>
    );
}

function FormField({ id, label, error, hint, children }: { id: Field; label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={id} className="label">{label}</label>
                {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </div>
            {children}
            {error && (
                <p id={`${id}-error`} className="field-error">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
                </p>
            )}
        </div>
    );
}

function TrackByProtocol() {
    const navigate = useNavigate();
    const [protocol, setProtocol] = useState('');
    const [touched, setTouched] = useState(false);
    const valid = UUID_PATTERN.test(protocol.trim());
    const showError = touched && protocol.trim() !== '' && !valid;

    return (
        <form
            className="card p-5"
            noValidate
            onSubmit={e => {
                e.preventDefault();
                setTouched(true);
                if (valid) navigate(`/chamados/${protocol.trim().toLowerCase()}`);
            }}
        >
            <label htmlFor="protocol" className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Search size={16} aria-hidden="true" /> Acompanhar chamado
            </label>
            <div className="flex gap-2">
                <input
                    id="protocol"
                    value={protocol}
                    onChange={e => setProtocol(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="Cole o protocolo completo"
                    aria-invalid={showError}
                    aria-describedby={showError ? 'protocol-error' : undefined}
                    className="input font-mono"
                />
                <button type="submit" className="btn-secondary btn-icon shrink-0" aria-label="Abrir chamado pelo protocolo">
                    <ArrowRight size={18} aria-hidden="true" />
                </button>
            </div>
            {showError && (
                <p id="protocol-error" className="field-error">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    O protocolo tem 36 caracteres, no formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.
                </p>
            )}
        </form>
    );
}

function CreatedCard({ ticket, onNew }: { ticket: Ticket; onNew: () => void }) {
    const headingRef = useRef<HTMLHeadingElement>(null);
    // Move o foco para a confirmação, para leitores de tela anunciarem o resultado
    useEffect(() => headingRef.current?.focus(), []);
    return (
        <div className="card p-6 sm:p-8">
            <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700" aria-hidden="true">
                <CheckCircle2 size={24} />
            </span>
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-foreground outline-none">
                Chamado aberto
            </h2>
            <p className="mt-2 text-muted-foreground">Recebemos sua solicitação. Guarde o protocolo para acompanhar.</p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Protocolo</p>
                    <p className="break-anywhere font-mono text-sm text-foreground">{ticket.id}</p>
                </div>
                <CopyButton text={ticket.id} />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">Categoria</dt>
                    <dd className="mt-1 text-sm font-semibold">{categoryLabel[ticket.category]}</dd>
                </div>
                <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">Prioridade</dt>
                    <dd className="mt-1"><PriorityBadge priority={ticket.priority} /></dd>
                </div>
                <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs font-semibold text-muted-foreground">Setor</dt>
                    <dd className="mt-1 text-sm font-semibold">{departmentLabel[ticket.department]}</dd>
                </div>
            </dl>

            {ticket.priority === 'INDEFINIDA' && (
                <p className="mt-4 flex gap-2 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-900">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Sua mensagem não trouxe detalhes do problema. Abra o chamado e conte o que está acontecendo para que ele seja priorizado.
                </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={`/chamados/${ticket.id}`} className="btn-primary">Acompanhar chamado</Link>
                <button type="button" onClick={onNew} className="btn-secondary">Abrir outro chamado</button>
            </div>
        </div>
    );
}
