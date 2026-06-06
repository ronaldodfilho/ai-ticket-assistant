import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/axios';
import type { Ticket, Interaction } from '../store/ticketStore';
import { ArrowLeft, Bot, Send, Zap, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    STATUS_OPTIONS, categoryLabel, departmentLabel, label, priorityColor, priorityLabel, statusLabel,
    type TicketStatus,
} from '../lib/labels';

const formatDate = (value?: string) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '—');

export default function TicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const [ticketRes, interactionsRes] = await Promise.all([
                api.get<Ticket>(`/tickets/${id}`),
                api.get<Interaction[]>(`/tickets/${id}/interactions`),
            ]);
            setTicket(ticketRes.data);
            setInteractions(interactionsRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err, 'Não foi possível carregar o chamado.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (id) fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [interactions.length]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setSending(true);
        setActionError(null);
        try {
            await api.post(`/tickets/${id}/interactions`, {
                message: newMessage,
                author: 'ATTENDANT',
                authorName: 'Atendente',
            });
            setNewMessage('');
            await fetchData();
        } catch (err) {
            console.error(err);
            setActionError(getErrorMessage(err, 'Erro ao enviar mensagem.'));
        } finally {
            setSending(false);
        }
    };

    const handleSummarize = async () => {
        setSummaryLoading(true);
        setActionError(null);
        try {
            const res = await api.get<{ summary: string }>(`/tickets/${id}/summary`);
            setSummary(res.data.summary);
        } catch (err) {
            console.error(err);
            setActionError(getErrorMessage(err, 'Erro ao resumir o chamado.'));
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleSuggest = async () => {
        setSuggestLoading(true);
        setActionError(null);
        try {
            const res = await api.get<{ suggestion: string }>(`/tickets/${id}/suggest-response`);
            setNewMessage(res.data.suggestion);
        } catch (err) {
            console.error(err);
            setActionError(getErrorMessage(err, 'Erro ao sugerir resposta.'));
        } finally {
            setSuggestLoading(false);
        }
    };

    const handleStatusChange = async (status: TicketStatus) => {
        setStatusUpdating(true);
        setActionError(null);
        try {
            const res = await api.patch<Ticket>(`/tickets/${id}/status`, { status });
            setTicket(res.data);
        } catch (err) {
            console.error(err);
            setActionError(getErrorMessage(err, 'Erro ao atualizar status.'));
        } finally {
            setStatusUpdating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;

    if (error || !ticket) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error ?? 'Chamado não encontrado.'}</p>
                <Link to="/dashboard" className="text-brand-600 font-medium hover:underline">Voltar ao Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Conteúdo principal: chat */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[32rem]" style={{ height: 'calc(100vh - 12rem)' }}>
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{ticket.title}</h2>
                                <p className="text-sm text-slate-500 font-mono">Chamado #{ticket.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {summary && (
                            <div className="relative bg-purple-50 border border-purple-100 text-purple-900 rounded-2xl p-4 pr-10">
                                <button onClick={() => setSummary(null)} className="absolute top-3 right-3 text-purple-400 hover:text-purple-700" aria-label="Fechar resumo">
                                    <X size={16} />
                                </button>
                                <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Bot size={14} /> Resumo do chamado</p>
                                <p className="text-sm whitespace-pre-wrap">{summary}</p>
                            </div>
                        )}
                        {interactions.map(interaction => (
                            <div key={interaction.id} className={`flex ${interaction.author === 'USER' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${
                                    interaction.author === 'USER'
                                        ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                        : 'bg-brand-500 text-white rounded-tr-sm'
                                }`}>
                                    <p className="text-xs font-semibold opacity-80 mb-1">{interaction.authorName}</p>
                                    <p className="whitespace-pre-wrap">{interaction.message}</p>
                                    <p className="text-[10px] mt-2 opacity-70 text-right">{formatDate(interaction.createdAt)}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        {actionError && <div className="mb-3 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">{actionError}</div>}
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={handleSummarize}
                                disabled={summaryLoading}
                                className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {summaryLoading ? <span className="animate-pulse">Resumindo...</span> : <><Bot size={16} /> Resumir Interações</>}
                            </button>
                            <button
                                onClick={handleSuggest}
                                disabled={suggestLoading}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {suggestLoading ? <span className="animate-pulse">Gerando...</span> : <><Zap size={16} /> Sugerir Resposta</>}
                            </button>
                        </div>
                        <form onSubmit={handleSend} className="flex gap-3 items-end">
                            <textarea
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.currentTarget.form?.requestSubmit();
                                    }
                                }}
                                rows={newMessage.length > 120 ? 4 : 1}
                                placeholder="Digite sua resposta... (Shift+Enter para nova linha)"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-none"
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="w-12 h-12 shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors"
                                aria-label="Enviar"
                            >
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Barra lateral: detalhes */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Classificação</h3>
                        <div className="space-y-4">
                            <Field title="Categoria" value={label(categoryLabel, ticket.category)} />
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Prioridade</p>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityColor[ticket.priority] ?? 'bg-slate-100 text-slate-700'}`}>
                                    {label(priorityLabel, ticket.priority)}
                                </span>
                            </div>
                            <Field title="Setor Responsável" value={label(departmentLabel, ticket.department)} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detalhes do Chamado</h3>
                        <div className="space-y-4">
                            <Field title="Solicitante" value={ticket.userName} />
                            <div>
                                <label htmlFor="status" className="block text-xs text-slate-500 mb-1">Status</label>
                                <select
                                    id="status"
                                    value={ticket.status}
                                    disabled={statusUpdating}
                                    onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-brand-500 disabled:opacity-50"
                                >
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                                </select>
                            </div>
                            <Field title="Abertura" value={formatDate(ticket.createdAt)} />
                            <Field title="Última atualização" value={formatDate(ticket.updatedAt)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ title, value }: { title: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-slate-500 mb-1">{title}</p>
            <p className="font-medium text-slate-800">{value}</p>
        </div>
    );
}
