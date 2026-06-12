import { Loader2, Send } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { getErrorMessage } from '../api/client';
import { InlineError } from './States';

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: (message: string) => Promise<void>;
    placeholder: string;
    disabled?: boolean;
    disabledReason?: string;
    toolbar?: ReactNode;
}

const MAX_LENGTH = 5000;

export function Composer({ value, onChange, onSend, placeholder, disabled, disabledReason, toolbar }: Props) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const message = value.trim();
        if (!message || sending || disabled) return;
        setSending(true);
        setError(null);
        try {
            await onSend(message);
            onChange('');
        } catch (err) {
            setError(getErrorMessage(err, 'Não foi possível enviar a mensagem.'));
        } finally {
            setSending(false);
        }
    };

    if (disabled) {
        return (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
                {disabledReason}
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2 border-t border-slate-200 bg-white p-3 sm:p-4">
            <InlineError message={error} />
            {toolbar}
            <div className="flex items-end gap-2">
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    rows={Math.min(6, Math.max(2, value.split('\n').length))}
                    maxLength={MAX_LENGTH}
                    placeholder={placeholder}
                    aria-label="Mensagem"
                    className="input resize-none"
                />
                <button type="submit" disabled={sending || !value.trim()} className="btn-primary h-10 w-10 shrink-0 px-0" aria-label="Enviar mensagem">
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </div>
            <p className="text-[11px] text-slate-400">Enter envia · Shift+Enter quebra a linha</p>
        </form>
    );
}
