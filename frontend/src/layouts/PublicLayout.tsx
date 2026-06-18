import { Headset } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function PublicLayout() {
    return (
        <div className="flex min-h-dvh flex-col">
            <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
            <header className="sticky top-0 z-40 border-b border-border bg-card">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Logo subtitle="Central de ajuda" />
                    <Link to="/atendimento" className="btn-ghost px-3">
                        <Headset size={18} aria-hidden="true" />
                        <span className="hidden sm:inline">Área do atendente</span>
                        <span className="sm:hidden">Atendente</span>
                    </Link>
                </div>
            </header>
            <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
                <Outlet />
            </main>
            <footer className="border-t border-border bg-card">
                <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
                    Chamados classificados automaticamente por IA e revisados pela equipe de suporte.
                </p>
            </footer>
        </div>
    );
}
