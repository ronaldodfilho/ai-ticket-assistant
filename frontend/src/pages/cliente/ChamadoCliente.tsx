import { ArrowLeft, Info } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/Badges';
import { ChatThread } from '../../components/ChatThread';
import { Composer } from '../../components/Composer';
import { CopyButton } from '../../components/CopyButton';
import { ErrorState, LoadingState } from '../../components/States';
import { usePolling } from '../../hooks/usePolling';
import { formatDateTime, shortId } from '../../lib/format';

export default function ChamadoCliente() {
    const { id = '' } = useParams();
    const [draft, setDraft] = useState('');
    const { data, loading, error, reload } = usePolling(
        async () => {
            const [ticket, interactions] = await Promise.all([api.getTicket(id), api.listInteractions(id)]);
            return { ticket, interactions };
        },
        8000,
        id,
    );

    if (loading) return <LoadingState label="Carregando chamado..." />;
    if (!data) {
        return <ErrorState message={error ?? 'Chamado não encontrado.'} action={<Link to="/" className="btn-secondary">Voltar ao início</Link>} />;
    }

    const { ticket, interactions } = data;
    const closed = ticket.status === 'FECHADO';

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
            <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                <ArrowLeft size={16} /> Voltar
            </Link>

            <div className="card overflow-hidden">
                <header className="border-b border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-slate-900">{ticket.title}</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Protocolo #{shortId(ticket.id)} · aberto em {formatDateTime(ticket.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={ticket.status} />
                            <CopyButton text={ticket.id} label="Protocolo" />
                        </div>
                    </div>
                    {ticket.priority === 'INDEFINIDA' && ticket.status !== 'FECHADO' && (
                        <p className="mt-4 flex gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
                            <Info size={16} className="mt-0.5 shrink-0" />
                            Precisamos de mais detalhes para priorizar seu chamado. Conte o que aconteceu, qual sistema ou equipamento
                            está com problema, a mensagem de erro e quantas pessoas estão sendo afetadas.
                        </p>
                    )}
                    {ticket.status === 'RESOLVIDO' && (
                        <p className="mt-4 flex gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            <Info size={16} className="mt-0.5 shrink-0" />
                            O suporte marcou este chamado como resolvido. Se o problema continuar, responda abaixo e ele será reaberto.
                        </p>
                    )}
                </header>

                <div className="h-[55vh] min-h-64 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                    <ChatThread interactions={interactions} viewer="USER" />
                </div>

                <Composer
                    value={draft}
                    onChange={setDraft}
                    placeholder="Escreva uma mensagem para o suporte..."
                    disabled={closed}
                    disabledReason="Este chamado foi fechado. Para um novo problema, abra outro chamado."
                    onSend={async message => {
                        await api.addInteraction(ticket.id, message, 'USER');
                        await reload();
                    }}
                />
            </div>
        </div>
    );
}
