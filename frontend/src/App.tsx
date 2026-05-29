import { Routes, Route, Link } from 'react-router-dom';
import Portal from './pages/Portal';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-lg">
            AI
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">Ticket Assistant</span>
        </div>
        <div className="flex gap-6">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Portal do Cliente</Link>
          <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Dashboard</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App;
