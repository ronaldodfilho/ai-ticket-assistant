import { MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
    return (
        <Link to={to} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <MessageSquareText size={18} />
            </span>
            <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-900">AI Ticket Assistant</span>
                {subtitle && <span className="block text-xs text-slate-500">{subtitle}</span>}
            </span>
        </Link>
    );
}
