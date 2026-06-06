import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '../api/axios';
import type { Ticket } from '../store/ticketStore';
import { categoryLabel, departmentLabel, label, priorityLabel } from '../lib/labels';
import { motion } from 'framer-motion';

export default function Portal() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState<Ticket | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const { createTicket } = useTicketStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const ticket = await createTicket({ title, description, userName: userName || 'Cliente Anônimo' });
            setCreated(ticket);
            setTitle('');
            setDescription('');
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err, 'Erro ao criar chamado. Tente novamente.'));
        } finally {
            setLoading(false);
        }
    };

    if (created) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center"
                >
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Chamado Aberto!</h2>
                    <p className="text-slate-600 mb-6">Seu chamado foi classificado automaticamente e encaminhado para a equipe responsável.</p>
                    <div className="grid grid-cols-3 gap-3 mb-8 text-left">
                        <Info title="Categoria" value={label(categoryLabel, created.category)} />
                        <Info title="Prioridade" value={label(priorityLabel, created.priority)} />
                        <Info title="Setor" value={label(departmentLabel, created.department)} />
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-6">Protocolo #{created.id.substring(0, 8)}</p>
                    <div className="flex flex-col gap-3">
                        <Link
                            to={`/tickets/${created.id}`}
                            className="w-full py-3 px-4 bg-brand-600 text-white hover:bg-brand-700 font-medium rounded-xl transition-colors"
                        >
                            Acompanhar Chamado
                        </Link>
                        <button
                            onClick={() => setCreated(null)}
                            className="w-full py-3 px-4 bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium rounded-xl transition-colors"
                        >
                            Abrir Novo Chamado
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-2xl font-bold text-slate-800">Como podemos ajudar?</h1>
                    <p className="text-slate-500 mt-1">Descreva seu problema e nossa IA o direcionará para a equipe correta.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Seu Nome</label>
                        <input 
                            type="text" 
                            required
                            value={userName}
                            onChange={e => setUserName(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Resumo do Problema</label>
                        <input 
                            type="text" 
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Não consigo acessar o sistema ERP"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Detalhes adicionais</label>
                        <textarea 
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-none"
                        />
                    </div>
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
                    )}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {loading ? 'Enviando...' : 'Enviar Chamado'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

function Info({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[11px] text-slate-500 mb-0.5">{title}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );
}
