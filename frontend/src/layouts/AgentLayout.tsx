import { ExternalLink, Inbox, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AiModeBadge } from '../components/AiModeBadge';
import { Logo } from '../components/Logo';
import { attendantName } from '../lib/storage';

const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 sm:min-h-10 ${
        isActive ? 'bg-primary-soft text-primary-active' : 'text-muted-foreground hover:bg-subtle hover:text-foreground'
    }`;

export default function AgentLayout() {
    const [name, setName] = useState(attendantName.get());

    return (
        <div className="flex min-h-dvh flex-col lg:flex-row">
            <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
            <aside className="z-30 flex shrink-0 flex-col gap-5 border-b border-border bg-card p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-r lg:border-b-0">
                <div className="flex items-center justify-between gap-3">
                    <Logo to="/atendimento" subtitle="Central de atendimento" />
                    <div className="lg:hidden"><AiModeBadge /></div>
                </div>

                <nav aria-label="Navegação do atendimento" className="flex gap-1 overflow-x-auto lg:flex-col">
                    <NavLink to="/atendimento" end className={navClass}>
                        <Inbox size={18} aria-hidden="true" /> Fila de chamados
                    </NavLink>
                    <Link to="/" className={navClass({ isActive: false })}>
                        <ExternalLink size={18} aria-hidden="true" /> Portal do cliente
                    </Link>
                </nav>

                <div className="space-y-4 lg:mt-auto">
                    <div>
                        <label htmlFor="attendant" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <UserRound size={14} aria-hidden="true" /> Seu nome nas respostas
                        </label>
                        <input
                            id="attendant"
                            value={name}
                            maxLength={100}
                            placeholder="Atendente"
                            autoComplete="name"
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

            <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none">
                <Outlet />
            </main>
        </div>
    );
}
