import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            // área de transferência indisponível (ex.: página sem HTTPS)
        }
    };

    return (
        <button type="button" onClick={copy} className="btn-ghost px-2.5 text-xs">
            {copied ? <Check size={14} className="text-emerald-700" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span aria-live="polite">{copied ? 'Copiado' : label}</span>
        </button>
    );
}
