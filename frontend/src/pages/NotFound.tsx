import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold text-brand-600">404</p>
            <h1 className="text-2xl font-semibold text-slate-900">Página não encontrada</h1>
            <Link to="/" className="btn-secondary mt-2">Ir para o início</Link>
        </div>
    );
}
