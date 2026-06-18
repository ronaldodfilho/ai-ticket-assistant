import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/Badges';
import { ChatThread } from '../../components/ChatThread';
import { Composer } from '../../components/Composer';
import { CopyButton } from '../../components/CopyButton';
import { ErrorState, LoadingRegion, Skeleton } from '../../components/States';
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

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
            <Link to="/" className="btn-ghost mb-4 -ml-3 px-3">
                <ArrowLeft size={18} aria-hidden="true" /> Voltar ao início
            </Link>

            {loading ? (
                <LoadingRegion label="Carregando chamado">
                    <div className="card space-y-4 p-5">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="space-y-3 pt-4">
                            <Skeleton className="h-16 w-3/4" />
                            <Skeleton className="ml-auto h-16 w-2/3" />
                        </div>
                    </div>
                </LoadingRegion>
            ) : !data ? (
                <div className="card">
                    <ErrorState message={error ?? 'Chamado não encontrado.'} action={<Link to="/" className="btn-secondary">Voltar ao início</Link>} />
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <header className="border-b border-border p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-balance text-foreground">{data.ticket.title}</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Protocolo #{shortId(data.ticket.id)} · aberto em {formatDateTime(data.ticket.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <StatusBadge status={data.ticket.status} />
                                <CopyButton text={data.ticket.id} label="Protocolo" />
                            </div>
                        </div>
                        {data.ticket.priority === 'INDEFINIDA' && data.ticket.status !== 'FECHADO' && (
                            <Notice tone="violet" icon={<Info size={16} />}>
                                Precisamos de mais detalhes para priorizar seu chamado. Conte o que aconteceu, qual sistema ou equipamento
                                está com problema, a mensagem de erro e quantas pessoas estão sendo afetadas.
                            </Notice>
                        )}
                        {data.ticket.status === 'RESOLVIDO' && (
                            <Notice tone="emerald" icon={<CheckCircle2 size={16} />}>
                                O suporte marcou este chamado como resolvido. Se o problema continuar, responda abaixo e ele será reaberto.
                            </Notice>
                        )}
                    </header>

                    <div className="h-[55dvh] min-h-72 overflow-y-auto bg-background p-4 sm:p-6">
                        <ChatThread interactions={data.interactions} viewer="USER" />
                    </div>

                    <Composer
                        value={draft}
                        onChange={setDraft}
                        label="Mensagem para o suporte"
                        placeholder="Escreva uma mensagem para o suporte..."
                        disabled={data.ticket.status === 'FECHADO'}
                        disabledReason="Este chamado foi fechado. Para um novo problema, abra outro chamado."
                        onSend={async message => {
                            await api.addInteraction(data.ticket.id, message, 'USER');
                            await reload();
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function Notice({ tone, icon, children }: { tone: 'violet' | 'emerald'; icon: React.ReactNode; children: React.ReactNode }) {
    const styles = tone === 'violet' ? 'bg-violet-50 text-violet-900' : 'bg-emerald-50 text-emerald-900';
    return (
        <p className={`mt-4 flex gap-2 rounded-lg px-3 py-2.5 text-sm leading-relaxed ${styles}`}>
            <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
            <span>{children}</span>
        </p>
    );
}
