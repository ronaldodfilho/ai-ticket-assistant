import { Cpu, Sparkles } from 'lucide-react';
import { useSystemInfo } from '../hooks/useSystemInfo';

export function AiModeBadge() {
    const info = useSystemInfo();
    if (!info) return null;

    return info.aiEnabled ? (
        <span title={`Modelo: ${info.aiModel}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-active ring-1 ring-inset ring-primary/20">
            <Sparkles size={12} aria-hidden="true" /> Gemini ativo
        </span>
    ) : (
        <span title="Defina GEMINI_API_KEY no arquivo .env para usar o Gemini" className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-slate-500/20">
            <Cpu size={12} aria-hidden="true" /> Modo local
        </span>
    );
}
