import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, EyeOff, Eye, PieChart as PieChartIcon, BellRing } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DashboardPage() {
  const { 
    balance, budget, setBudget, transactions, focusMode, toggleFocusMode, 
    categories, subscriptions, addSubscription 
  } = useStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showChart, setShowChart] = useState(false);
  
  const [newBudget, setNewBudget] = useState(budget.toString());
  
  // New sub state
  const [newSub, setNewSub] = useState({ name: '', amount: '', category_id: '3', day_of_month: '15' });

  // Lógica del ciclo quincenal
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('es-DO', { month: 'short' });
  const year = today.getFullYear();
  const isFirstHalf = day <= 15;
  const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
  const cycleText = isFirstHalf ? `1-15 ${month}` : `16-${lastDay} ${month}`;

  // Matemáticas para Presupuesto Diario Seguro
  const daysInCycle = isFirstHalf ? 15 : lastDay - 15;
  const daysElapsed = isFirstHalf ? day : day - 15;
  const daysRemaining = Math.max(1, daysInCycle - daysElapsed);

  const activeTransactions = transactions.filter(t => {
    const [y, m, d] = t.date.split('-');
    if (parseInt(m) !== today.getMonth() + 1 || parseInt(y) !== year) return false;
    const txDay = parseInt(d);
    return isFirstHalf ? txDay <= 15 : txDay > 15;
  });

  const spent = activeTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const available = budget - spent;
  const progressPercent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  
  const safeDaily = available > 0 ? available / daysRemaining : 0;

  let progressColor = 'bg-success';
  if (progressPercent > 60) progressColor = 'bg-warning';
  if (progressPercent > 85) progressColor = 'bg-danger';

  // Lógica del Gráfico
  const expensesByCategory = activeTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {});

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const chartData = Object.keys(expensesByCategory).map((catId, index) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat ? cat.name : 'Otro',
      value: expensesByCategory[catId],
      fill: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => b.value - a.value);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    setBudget(parseFloat(newBudget) || 0);
    setShowSettings(false);
  };

  const handleAddSub = (e) => {
    e.preventDefault();
    addSubscription({
      name: newSub.name,
      amount: parseFloat(newSub.amount),
      category_id: newSub.category_id,
      day_of_month: parseInt(newSub.day_of_month),
      last_processed: null
    });
    setNewSub({ name: '', amount: '', category_id: '3', day_of_month: '15' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 glass px-4 py-2 rounded-xl text-sm border border-white/10 shadow-xl">
          <p className="font-bold text-white">{payload[0].name}</p>
          <p className="text-primary">RD$ {payload[0].value.toLocaleString('es-DO')}</p>
        </div>
      );
    }
    return null;
  };

  if (budget === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-4">
          <Settings size={48} />
        </div>
        <h2 className="text-2xl font-bold">¡Bienvenido a Fianza!</h2>
        <p className="text-text-muted">Para empezar a usar el dashboard, configura tu presupuesto quincenal.</p>
        <button 
          onClick={() => setShowSettings(true)}
          className="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          Configurar Presupuesto
        </button>
      </div>
    );
  }

  if (focusMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-20 space-y-8 relative">
        <button onClick={toggleFocusMode} className="absolute top-6 right-6 text-text-muted hover:text-text transition-colors">
          <EyeOff size={24} />
        </button>
        <div className="text-center">
          <p className="text-lg text-text-muted mb-2 uppercase tracking-widest">Disponible</p>
          <p className={`text-6xl font-black ${available >= 0 ? 'text-success' : 'text-danger'} drop-shadow-lg`}>
            ${available.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
          </p>
          
          <div className="mt-8 inline-block bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <p className="text-sm text-text-muted uppercase tracking-wider mb-1">Límite Diario Seguro</p>
            <p className="text-2xl font-bold text-white">RD$ {safeDaily.toLocaleString('es-DO', { maximumFractionDigits: 0 })} <span className="text-sm text-text-muted">/día</span></p>
            <p className="text-xs text-text-muted mt-1">por los próximos {daysRemaining} días</p>
          </div>
        </div>
        
        <div className="flex space-x-8 text-sm text-text-muted pt-8 w-full max-w-xs justify-center">
          <div className="text-center">
            <p className="uppercase text-[10px] tracking-wider mb-1">Presupuesto</p>
            <p className="font-semibold text-text">${budget.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center">
            <p className="uppercase text-[10px] tracking-wider mb-1">Gastado</p>
            <p className="font-semibold text-text">${spent.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 pb-20 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text">Resumen</h1>
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">Ciclo: {cycleText}</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowChart(!showChart)} className={`transition-colors p-2 rounded-full ${showChart ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}>
            <PieChartIcon size={22} />
          </button>
          <button onClick={toggleFocusMode} className="text-text-muted hover:text-text transition-colors p-2">
            <Eye size={22} />
          </button>
          <button onClick={() => setShowSettings(true)} className="text-text-muted hover:text-text transition-colors p-2">
            <Settings size={22} />
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl space-y-5">
        <div>
          <p className="text-text-muted mb-1">Saldo Disponible</p>
          <p className={`text-4xl font-bold tracking-tight ${available >= 0 ? 'text-text' : 'text-danger'}`}>
            RD$ {available.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Límite Diario</p>
            <p className="font-semibold text-white">RD$ {safeDaily.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider">Faltan</p>
            <p className="font-semibold text-white">{daysRemaining} días</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Gastado: {progressPercent.toFixed(0)}%</span>
            <span className="text-text-muted">RD$ {budget.toLocaleString('es-DO')}</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${progressColor} transition-all duration-500`} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {showChart && chartData.length > 0 && (
        <div className="glass p-4 rounded-3xl animate-slide-up">
          <h2 className="text-sm font-semibold text-text-muted mb-4 uppercase text-center tracking-widest">Gastos por Categoría</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center text-xs text-text-muted bg-white/5 px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.fill }}></div>
                {entry.name}: {((entry.value / spent) * 100).toFixed(0)}%
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Movimientos del Ciclo</h2>
        <div className="space-y-3">
          {activeTransactions.slice(0, 5).map(tx => {
            const cat = categories.find(c => c.id === tx.category_id);
            return (
              <div key={tx.id} className="flex justify-between items-center p-4 glass rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${tx.type === 'income' ? 'bg-success/20' : 'bg-white/10'}`}>
                    {cat ? cat.icon : (tx.type === 'income' ? '💰' : '💸')}
                  </div>
                  <div>
                    <p className="font-medium text-text text-sm">{tx.note || cat?.name || 'Movimiento'}</p>
                    <p className="text-[10px] text-text-muted">{tx.date}</p>
                  </div>
                </div>
                <p className={`font-semibold ${tx.type === 'income' ? 'text-success' : 'text-text'}`}>
                  {tx.type === 'income' ? '+' : '-'}RD$ {tx.amount.toLocaleString('es-DO')}
                </p>
              </div>
            )
          })}
          {activeTransactions.length === 0 && (
            <p className="text-center text-text-muted py-4">No hay movimientos en este ciclo.</p>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass p-6 rounded-3xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold">Configuración</h2>
              <button onClick={() => setShowSettings(false)} className="text-text-muted hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="space-y-4 mb-8">
              <div>
                <label className="block text-sm text-text-muted mb-1 font-medium">Presupuesto Quincenal</label>
                <input 
                  type="number" 
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-lg"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors">
                Actualizar Presupuesto
              </button>
            </form>

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold flex items-center mb-4">
                <BellRing size={18} className="mr-2 text-warning" />
                Suscripciones
              </h3>
              
              {subscriptions.length > 0 && (
                <div className="mb-4 space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="bg-black/20 p-3 rounded-xl flex justify-between text-sm">
                      <span>{sub.name} (Día {sub.day_of_month})</span>
                      <span className="text-danger font-bold">RD$ {sub.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddSub} className="space-y-3 bg-white/5 p-4 rounded-2xl">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Añadir Nueva Suscripción</p>
                <input 
                  type="text" required placeholder="Nombre (ej. Netflix)" 
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})}
                />
                <input 
                  type="number" required placeholder="Monto (RD$)" 
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  value={newSub.amount} onChange={e => setNewSub({...newSub, amount: e.target.value})}
                />
                <div className="flex space-x-2">
                  <select 
                    className="w-1/2 bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                    value={newSub.category_id} onChange={e => setNewSub({...newSub, category_id: e.target.value})}
                  >
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  <input 
                    type="number" min="1" max="31" required placeholder="Día cobro" 
                    className="w-1/2 bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                    value={newSub.day_of_month} onChange={e => setNewSub({...newSub, day_of_month: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-warning hover:bg-warning/90 text-white font-bold py-2 rounded-lg text-sm mt-2 transition-colors">
                  Añadir Recurrente
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
