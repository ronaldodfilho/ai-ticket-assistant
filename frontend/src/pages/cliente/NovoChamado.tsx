import { ArrowRight, CheckCircle2, ClipboardList, Loader2, Search, Send, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client';
import type { Ticket } from '../../api/types';
import { CopyButton } from '../../components/CopyButton';
import { InlineError } from '../../components/States';
import { PriorityBadge } from '../../components/Badges';
import { formatRelative, shortId } from '../../lib/format';
import { categoryLabel, departmentLabel } from '../../lib/labels';
import { myTickets } from '../../lib/storage';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function NovoChamado() {
    const [userName, setUserName] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<Ticket | null>(null);
    const [saved, setSaved] = useState(myTickets.list());

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const ticket = await api.createTicket({ title, description, userName });
            myTickets.add({ id: ticket.id, title: ticket.title, createdAt: ticket.createdAt });
            setSaved(myTickets.list());
            setCreated(ticket);
            setTitle('');
            setDescription('');
        } catch (err) {
            setError(getErrorMessage(err, 'Não foi possível abrir o chamado. Tente novamente.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_320px]">
            <section>
                {created ? (
                    <CreatedCard ticket={created} onNew={() => setCreated(null)} />
                ) : (
                    <>
                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Como podemos ajudar?</h1>
                            <p className="mt-2 text-slate-600">
                                Descreva o problema. O chamado é classificado automaticamente e encaminhado para a equipe certa.
                            </p>
                        </div>
                        <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
                            <div>
                                <label htmlFor="userName" className="label">Seu nome</label>
                                <input id="userName" required maxLength={100} value={userName} onChange={e => setUserName(e.target.value)} placeholder="Ex.: Maria Souza" className="input" />
                            </div>
                            <div>
                                <label htmlFor="title" className="label">Assunto</label>
                                <input id="title" required maxLength={150} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Erro ao emitir nota fiscal no ERP" className="input" />
                            </div>
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <label htmlFor="description" className="label">Descrição</label>
                                    <span className="text-xs text-slate-400">{description.length}/5000</span>
                                </div>
                                <textarea
                                    id="description"
                                    required
                                    rows={6}
                                    maxLength={5000}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="O que aconteceu, desde quando, qual mensagem de erro apareceu e quem está sendo afetado."
                                    className="input resize-y"
                                />
                            </div>
                            <InlineError message={error} />
                            <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 sm:w-auto">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {submitting ? 'Classificando e enviando...' : 'Abrir chamado'}
                            </button>
                        </form>
                    </>
                )}
            </section>

            <aside className="space-y-6">
                <TrackByProtocol />
                <div className="card p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ClipboardList size={16} /> Meus chamados
                    </h2>
                    {saved.length === 0 ? (
                        <p className="text-sm text-slate-500">Os chamados abertos neste navegador aparecem aqui.</p>
                    ) : (
                        <ul className="-mx-2 space-y-1">
                            {saved.map(ticket => (
                                <li key={ticket.id}>
                                    <Link to={`/chamados/${ticket.id}`} className="block rounded-lg px-2 py-2 hover:bg-slate-50">
                                        <span className="block truncate text-sm font-medium text-slate-800">{ticket.title}</span>
                                        <span className="text-xs text-slate-500">#{shortId(ticket.id)} · {formatRelative(ticket.createdAt)}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-xl bg-brand-50 p-5 text-sm text-brand-900">
                    <p className="mb-2 flex items-center gap-2 font-semibold"><Sparkles size={16} /> Triagem automática</p>
                    <p className="text-brand-900/80">
                        A IA identifica categoria, prioridade e setor do chamado assim que ele é aberto, para que a pessoa certa responda mais rápido.
                    </p>
                </div>
            </aside>
        </div>
    );

}

function TrackByProtocol() {
    const navigate = useNavigate();
    const [protocol, setProtocol] = useState('');
    const valid = UUID_PATTERN.test(protocol.trim());
    return (
        <form
            className="card p-5"
            onSubmit={e => {
                e.preventDefault();
                if (valid) navigate(`/chamados/${protocol.trim().toLowerCase()}`);
            }}
        >
            <label htmlFor="protocol" className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Search size={16} /> Acompanhar chamado
            </label>
            <div className="flex gap-2">
                <input id="protocol" value={protocol} onChange={e => setProtocol(e.target.value)} placeholder="Cole o protocolo completo" className="input font-mono text-xs" />
                <button type="submit" disabled={!valid} className="btn-secondary px-3" aria-label="Abrir chamado">
                    <ArrowRight size={16} />
                </button>
            </div>
            {protocol && !valid && <p className="mt-2 text-xs text-slate-500">O protocolo tem 36 caracteres, no formato xxxxxxxx-xxxx-...</p>}
        </form>
    );
}

function CreatedCard({ ticket, onNew }: { ticket: Ticket; onNew: () => void }) {
    return (
        <div className="card p-6 sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chamado aberto</h1>
            <p className="mt-2 text-slate-600">Recebemos sua solicitação e ela já foi encaminhada. Guarde o protocolo para acompanhar.</p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                    <p className="text-xs text-slate-500">Protocolo</p>
                    <p className="font-mono text-sm break-all text-slate-900">{ticket.id}</p>
                </div>
                <CopyButton text={ticket.id} />
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                    <dt className="text-xs text-slate-500">Categoria</dt>
                    <dd className="mt-1 text-sm font-medium">{categoryLabel[ticket.category]}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                    <dt className="text-xs text-slate-500">Prioridade</dt>
                    <dd className="mt-1"><PriorityBadge priority={ticket.priority} /></dd>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                    <dt className="text-xs text-slate-500">Setor</dt>
                    <dd className="mt-1 text-sm font-medium">{departmentLabel[ticket.department]}</dd>
                </div>
            </dl>

            {ticket.priority === 'INDEFINIDA' && (
                <p className="mt-4 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
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
