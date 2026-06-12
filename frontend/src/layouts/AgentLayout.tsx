import { ExternalLink, Inbox, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AiModeBadge } from '../components/AiModeBadge';
import { Logo } from '../components/Logo';
import { attendantName } from '../lib/storage';

export default function AgentLayout() {
    const [name, setName] = useState(attendantName.get());

    const navClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
        }`;

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            <aside className="flex shrink-0 flex-col gap-6 border-b border-slate-200 bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between lg:block">
                    <Logo to="/atendimento" subtitle="Atendimento" />
                    <div className="lg:hidden"><AiModeBadge /></div>
                </div>

                <nav className="flex gap-1 lg:flex-col">
                    <NavLink to="/atendimento" end className={navClass}>
                        <Inbox size={16} /> Fila de chamados
                    </NavLink>
                    <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                        <ExternalLink size={16} /> Portal do cliente
                    </Link>
                </nav>

                <div className="space-y-4 lg:mt-auto">
                    <div>
                        <label htmlFor="attendant" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <UserRound size={14} /> Seu nome nas respostas
                        </label>
                        <input
                            id="attendant"
                            value={name}
                            maxLength={100}
                            placeholder="Atendente"
                            onChange={e => {
                                setName(e.target.value);
                                attendantName.set(e.target.value);
                            }}
                            className="input"
                        />
                    </div>
                    <div className="hidden lg:block"><AiModeBadge /></div>
                </div>
            </aside>

            <main className="min-w-0 flex-1">
                <Outlet />
            </main>
        </div>
    );
}
