import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/axios';
import type { Ticket, Interaction } from '../store/ticketStore';
import { ArrowLeft, Bot, Send, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function TicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [newMessage, setNewMessage] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [ticketRes, interactionsRes] = await Promise.all([
                api.get(`/tickets/${id}`),
                api.get(`/tickets/${id}/interactions`)
            ]);
            setTicket(ticketRes.data);
            setInteractions(interactionsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newMessage.trim()) return;
        try {
            await api.post(`/tickets/${id}/interactions`, {
                message: newMessage,
                author: 'ATTENDANT',
                authorName: 'Atendente'
            });
            setNewMessage('');
            fetchData();
        } catch(e) {
            console.error(e);
        }
    };

    const handleSummarize = async () => {
        setSummaryLoading(true);
        try {
            const res = await api.get(`/tickets/${id}/summary`);
            alert("Resumo da IA:\\n\\n" + res.data.summary);
        } catch(e) {
            console.error(e);
            alert("Erro ao resumir");
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleSuggest = async () => {
        setSuggestLoading(true);
        try {
            const res = await api.get(`/tickets/${id}/suggest-response`);
            setNewMessage(res.data.suggestion);
        } catch(e) {
            console.error(e);
            alert("Erro ao sugerir resposta");
        } finally {
            setSuggestLoading(false);
        }
    };

    if (loading || !ticket) return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;

    return (
        <div className="flex-1 p-8">
            <div className="max-w-6xl mx-auto flex gap-8">
                {/* Main Content: Chat */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" style={{height: 'calc(100vh - 12rem)'}}>
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{ticket.title}</h2>
                                <p className="text-sm text-slate-500 font-mono">Chamado #{ticket.id.substring(0,8)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {interactions.map(interaction => (
                            <div key={interaction.id} className={`flex ${interaction.author === 'USER' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 ${
                                    interaction.author === 'USER' 
                                        ? 'bg-slate-100 text-slate-800 rounded-tl-sm' 
                                        : 'bg-brand-500 text-white rounded-tr-sm'
                                }`}>
                                    <p className="text-xs font-semibold opacity-80 mb-1">{interaction.authorName}</p>
                                    <p className="whitespace-pre-wrap">{interaction.message}</p>
                                    <p className="text-[10px] mt-2 opacity-70 text-right">
                                        {format(new Date(interaction.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex gap-2 mb-3">
                            <button 
                                onClick={handleSummarize}
                                disabled={summaryLoading}
                                className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {summaryLoading ? <span className="animate-pulse">Resumindo...</span> : <><Bot size={16}/> Resumir Interações</>}
                            </button>
                            <button 
                                onClick={handleSuggest}
                                disabled={suggestLoading}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {suggestLoading ? <span className="animate-pulse">Gerando...</span> : <><Zap size={16}/> Sugerir Resposta</>}
                            </button>
                        </div>
                        <form onSubmit={handleSend} className="flex gap-3">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Digite sua resposta..."
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                            />
                            <button 
                                type="submit"
                                className="w-12 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar: Details */}
                <div className="w-80 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Classificação (IA)</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Categoria</p>
                                <p className="font-medium text-slate-800">{ticket.category}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Prioridade</p>
                                <p className="font-medium text-slate-800">{ticket.priority}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Setor Responsável</p>
                                <p className="font-medium text-slate-800">{ticket.department}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Detalhes do Chamado</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Solicitante</p>
                                <p className="font-medium text-slate-800">{ticket.userName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Status Atual</p>
                                <p className="font-medium text-slate-800">{ticket.status}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Abertura</p>
                                <p className="font-medium text-slate-800">{format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
