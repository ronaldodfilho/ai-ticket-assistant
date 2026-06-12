import { Route, Routes } from 'react-router-dom';
import AgentLayout from './layouts/AgentLayout';
import PublicLayout from './layouts/PublicLayout';
import ChamadoAtendente from './pages/atendimento/ChamadoAtendente';
import Fila from './pages/atendimento/Fila';
import ChamadoCliente from './pages/cliente/ChamadoCliente';
import NovoChamado from './pages/cliente/NovoChamado';
import NotFound from './pages/NotFound';

export default function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<NovoChamado />} />
                <Route path="/chamados/:id" element={<ChamadoCliente />} />
            </Route>
            <Route path="/atendimento" element={<AgentLayout />}>
                <Route index element={<Fila />} />
                <Route path="chamados/:id" element={<ChamadoAtendente />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
