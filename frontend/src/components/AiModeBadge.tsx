import { Sparkles, Cpu } from 'lucide-react';
import { useSystemInfo } from '../hooks/useSystemInfo';

export function AiModeBadge() {
    const info = useSystemInfo();
    if (!info) return null;

    return info.aiEnabled ? (
        <span title={`Modelo: ${info.aiModel}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
            <Sparkles size={12} /> Gemini ativo
        </span>
    ) : (
        <span title="Defina GEMINI_API_KEY no backend para usar o Gemini" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
            <Cpu size={12} /> Modo local
        </span>
    );
}
