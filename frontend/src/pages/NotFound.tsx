import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-bold text-primary">404</p>
            <h1 className="text-2xl font-bold text-foreground">Página não encontrada</h1>
            <p className="text-sm text-muted-foreground">O endereço pode estar errado ou a página foi removida.</p>
            <Link to="/" className="btn-secondary mt-2">Ir para o início</Link>
        </main>
    );
}
