import { Loader2, Send } from 'lucide-react';
import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { getErrorMessage } from '../api/client';
import { InlineError } from './States';

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: (message: string) => Promise<void>;
    placeholder: string;
    label: string;
    disabled?: boolean;
    disabledReason?: string;
    toolbar?: ReactNode;
}

const MAX_LENGTH = 5000;

export function Composer({ value, onChange, onSend, placeholder, label, disabled, disabledReason, toolbar }: Props) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hintId = useId();

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

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
        // Durante a composição de acentos ou ideogramas (IME), Enter confirma o caractere, não envia
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        e.preventDefault();
        submit();
    };

    if (disabled) {
        return (
            <p className="border-t border-border bg-subtle px-4 py-4 text-center text-sm text-muted-foreground">
                {disabledReason}
            </p>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-2.5 border-t border-border bg-card p-3 sm:p-4">
            <InlineError message={error} />
            {toolbar}
            <div className="flex items-end gap-2">
                <label className="sr-only" htmlFor={`${hintId}-input`}>{label}</label>
                <textarea
                    id={`${hintId}-input`}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={Math.min(6, Math.max(2, value.split('\n').length))}
                    maxLength={MAX_LENGTH}
                    placeholder={placeholder}
                    aria-describedby={hintId}
                    className="input resize-none leading-relaxed"
                />
                <button type="submit" disabled={sending || !value.trim()} className="btn-primary btn-icon shrink-0" aria-label="Enviar mensagem">
                    {sending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                </button>
            </div>
            <p id={hintId} className="hidden text-xs text-muted-foreground sm:block">
                Enter envia · Shift+Enter quebra a linha
            </p>
        </form>
    );
}
