import { useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { Home, PlusCircle, CreditCard } from 'lucide-react';

import CapturePage from './pages/CapturePage';
import DashboardPage from './pages/DashboardPage';
import DebtsPage from './pages/DebtsPage';

function App() {
  const { initStore, focusMode } = useStore();
  const location = useLocation();
  
  // Activa el hook de sincronización en background
  useOfflineSync();

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div className="w-full flex flex-col h-[100dvh] relative overflow-hidden">
      
      {/* Rutas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/capture" element={<CapturePage />} />
          <Route path="/debts" element={<DebtsPage />} />
        </Routes>
      </div>

      {/* Navegación Inferior (Se oculta en Focus Mode si estamos en Dashboard) */}
      {!(focusMode && location.pathname === '/') && (
        <nav className="absolute bottom-0 w-full glass border-t border-white/10 pb-safe pt-2 px-6 flex justify-between items-center z-40 bg-surface/80 backdrop-blur-xl rounded-t-3xl h-20">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 transition-colors w-16 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-medium">Inicio</span>
          </NavLink>

          <NavLink 
            to="/capture" 
            className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 transition-all -translate-y-4 w-16 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
          >
            {({ isActive }) => (
              <>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl ${isActive ? 'bg-primary text-white shadow-primary/30' : 'bg-surface border border-white/10 text-primary'}`}>
                  <PlusCircle size={32} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-text-muted'}`}>Captura</span>
              </>
            )}
          </NavLink>

          <NavLink 
            to="/debts" 
            className={({ isActive }) => `flex flex-col items-center justify-center space-y-1 transition-colors w-16 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}`}
          >
            <CreditCard size={24} />
            <span className="text-[10px] font-medium">Deudas</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

export default App;
