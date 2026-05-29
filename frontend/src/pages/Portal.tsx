import { useState } from 'react';
import { useTicketStore } from '../store/ticketStore';
import { Loader2, CheckCircle2, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Portal() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const { createTicket } = useTicketStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTicket({ title, description, userName: userName || 'Cliente Anônimo' });
            setSuccess(true);
            setTitle('');
            setDescription('');
        } catch (error) {
            console.error(error);
            alert("Erro ao criar chamado.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
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
                    <p className="text-slate-600 mb-8">Nossa inteligência artificial já classificou seu chamado e a equipe responsável será notificada em breve.</p>
                    <button 
                        onClick={() => setSuccess(false)}
                        className="w-full py-3 px-4 bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium rounded-xl transition-colors"
                    >
                        Abrir Novo Chamado
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
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
