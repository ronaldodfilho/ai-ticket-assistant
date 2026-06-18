import { MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
    return (
        <Link to={to} className="flex min-h-11 items-center gap-2.5 rounded-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary" aria-hidden="true">
                <MessageSquareText size={18} />
            </span>
            <span className="leading-tight">
                <span className="block text-sm font-bold text-foreground">AI Ticket Assistant</span>
                {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
            </span>
        </Link>
    );
}
