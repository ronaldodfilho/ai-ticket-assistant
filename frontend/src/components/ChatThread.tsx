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
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [interactions.length]);

    return (
        <ol className="space-y-4">
            {interactions.map(interaction => {
                const mine = interaction.author === viewer;
                const roleLabel = interaction.author === 'USER' ? 'Cliente' : 'Suporte';
                return (
                    <li key={interaction.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className="mb-1 flex items-center gap-2 px-1 text-xs text-slate-500">
                                <span className="font-medium text-slate-700">{interaction.authorName}</span>
                                <span>·</span>
                                <span>{roleLabel}</span>
                            </div>
                            <div
                                className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    mine
                                        ? 'rounded-br-md bg-brand-600 text-white'
                                        : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                                }`}
                            >
                                {interaction.message}
                            </div>
                            <time
                                dateTime={interaction.createdAt}
                                title={formatDateTime(interaction.createdAt)}
                                className="mt-1 px-1 text-[11px] text-slate-400"
                            >
                                {formatTime(interaction.createdAt)}
                            </time>
                        </div>
                    </li>
                );
            })}
            <div ref={endRef} />
        </ol>
    );
}
