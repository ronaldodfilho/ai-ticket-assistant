import { Headset } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function PublicLayout() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    <Logo subtitle="Central de ajuda" />
                    <Link to="/atendimento" className="btn-ghost px-3 text-xs sm:text-sm">
                        <Headset size={16} /> <span>Área do atendente</span>
                    </Link>
                </div>
            </header>
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}
