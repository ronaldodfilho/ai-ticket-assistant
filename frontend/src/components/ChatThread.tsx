import { useEffect, useRef } from 'react';
import type { Interaction, InteractionAuthor } from '../api/types';
import { formatDateTime, formatTime } from '../lib/format';

interface Props {
    interactions: Interaction[];
    /** Quem está olhando a conversa: as mensagens dessa pessoa ficam à direita. */
    viewer: Exclude<InteractionAuthor, 'SYSTEM_AI'>;
}

export function ChatThread({ interactions, viewer }: Props) {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [interactions.length]);

    return (
        <div role="log" aria-label="Histórico de mensagens">
            <ol className="space-y-5">
                {interactions.map(interaction => {
                    const mine = interaction.author === viewer;
                    const roleLabel = interaction.author === 'USER' ? 'Cliente' : 'Suporte';
                    return (
                        <li key={interaction.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <article className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${mine ? 'items-end' : 'items-start'}`}>
                                <header className="mb-1 flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{interaction.authorName}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>{roleLabel}</span>
                                </header>
                                <div
                                    className={`break-anywhere rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap sm:text-sm ${
                                        mine
                                            ? 'rounded-br-md bg-primary text-on-primary'
                                            : 'rounded-bl-md border border-border bg-card text-foreground'
                                    }`}
                                >
                                    {interaction.message}
                                </div>
                                <time dateTime={interaction.createdAt} title={formatDateTime(interaction.createdAt)} className="mt-1 px-1 text-xs text-muted-foreground tabular-nums">
                                    {formatTime(interaction.createdAt)}
                                </time>
                            </article>
                        </li>
                    );
                })}
            </ol>
            <div ref={endRef} />
        </div>
    );
}
