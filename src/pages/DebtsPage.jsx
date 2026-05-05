import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calculator, Plus, HandCoins } from 'lucide-react';

export default function DebtsPage() {
  const { debts, addDebt, payDebt } = useStore();
  const [showSim, setShowSim] = useState(false);
  const [showNewDebt, setShowNewDebt] = useState(false);
  const [showPayDebt, setShowPayDebt] = useState(false);
  
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [extraPayment, setExtraPayment] = useState(0);

  // Estados modales
  const [newDebtData, setNewDebtData] = useState({ name: '', balance: '', annual_interest_rate: '', min_payment: '', due_date: '' });
  const [payData, setPayData] = useState({ amount: '', date: new Date().toISOString().split('T')[0] });

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!newDebtData.name || !newDebtData.balance) return;
    addDebt({
      name: newDebtData.name,
      balance: parseFloat(newDebtData.balance) || 0,
      annual_interest_rate: parseFloat(newDebtData.annual_interest_rate) || 0,
      min_payment: parseFloat(newDebtData.min_payment) || 0,
      due_date: parseInt(newDebtData.due_date) || 1
    });
    setShowNewDebt(false);
    setNewDebtData({ name: '', balance: '', annual_interest_rate: '', min_payment: '', due_date: '' });
  };

  const handlePayDebt = (e) => {
    e.preventDefault();
    if (!payData.amount || payData.amount <= 0) return;
    payDebt(selectedDebt.id, parseFloat(payData.amount), payData.date);
    setShowPayDebt(false);
    setPayData({ amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const calculateSim = (debt, extra) => {
    const rate = debt.annual_interest_rate / 100 / 12; // Mensual
    const totalPayment = debt.min_payment + parseFloat(extra || 0);
    
    if (totalPayment <= debt.balance * rate) return { monthsDiff: '∞', saved: 0, dateOpt: 'Nunca' };
    if (rate === 0) {
      const base = debt.balance / debt.min_payment;
      const opt = debt.balance / totalPayment;
      return { monthsDiff: Math.max(0, Math.ceil(base - opt)), saved: 0 };
    }
    
    const calcMonths = (P, A, r) => {
      const val = 1 - (r * P) / A;
      if (val <= 0) return 999;
      return -Math.log(val) / Math.log(1 + r);
    };

    const monthsBase = calcMonths(debt.balance, debt.min_payment, rate);
    const monthsExtra = calcMonths(debt.balance, totalPayment, rate);
    
    const interestBase = (monthsBase * debt.min_payment) - debt.balance;
    const interestExtra = (monthsExtra * totalPayment) - debt.balance;
    
    const saved = interestBase - interestExtra;
    
    const d = new Date();
    d.setMonth(d.getMonth() + Math.ceil(monthsExtra));
    const releaseDate = d.toLocaleString('es-DO', { month: 'short', year: 'numeric' });

    return {
      monthsDiff: Math.max(0, Math.ceil(monthsBase - monthsExtra)),
      saved: Math.max(0, saved),
      releaseDate
    };
  };

  return (
    <div className="flex-1 flex flex-col p-6 pb-24 overflow-y-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Gestor de Deudas</h1>
        <button 
          onClick={() => setShowNewDebt(true)}
          className="text-success hover:text-success/80 transition-colors p-2 glass rounded-full"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {debts.map(debt => (
          <div key={debt.id} className="glass p-5 rounded-2xl border-l-4 border-l-danger hover:bg-white/5 transition-colors">
            <div 
              className="cursor-pointer"
              onClick={() => { setSelectedDebt(debt); setExtraPayment(0); setShowSim(true); }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-text">{debt.name}</h3>
                <p className="text-danger font-bold text-lg">RD$ {debt.balance.toLocaleString('es-DO')}</p>
              </div>
              <div className="flex justify-between text-sm text-text-muted mb-4">
                <span>Mínimo: RD$ {debt.min_payment}</span>
                <span>Tasa: {debt.annual_interest_rate}%</span>
              </div>
            </div>
            
            {/* Botón Registrar Pago separado */}
            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDebt(debt);
                  setShowPayDebt(true);
                }}
                className="flex items-center space-x-2 text-sm bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-xl transition-colors"
              >
                <HandCoins size={16} />
                <span>Registrar Pago</span>
              </button>
            </div>
          </div>
        ))}
        {debts.length === 0 && (
          <div className="text-center p-8 glass rounded-2xl text-text-muted">
            <p>No tienes deudas registradas.</p>
            <button onClick={() => setShowNewDebt(true)} className="mt-4 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm">
              Agregar mi primera deuda
            </button>
          </div>
        )}
      </div>

      {/* Modal Pagar Deuda */}
      {showPayDebt && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass bg-surface/90 p-6 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <HandCoins size={20} className="text-success" />
                <span>Abonar a {selectedDebt.name}</span>
              </h2>
              <button onClick={() => setShowPayDebt(false)} className="text-text-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handlePayDebt} className="space-y-4">
              <p className="text-sm text-text-muted">Balance actual: RD$ {selectedDebt.balance}</p>
              <div>
                <label className="block text-sm text-text-muted mb-1">Monto a abonar (RD$)</label>
                <input 
                  type="number" required autoFocus
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-lg"
                  value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})}
                  placeholder="Ej. 1500"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Fecha</label>
                <input 
                  type="date" required
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-lg"
                  value={payData.date} onChange={e => setPayData({...payData, date: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-success hover:bg-success/90 text-white font-bold py-3 rounded-xl mt-4 transition-colors shadow-[0_0_15px_#10b98155]">
                Confirmar Pago
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Deuda */}
      {showNewDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass bg-surface/90 p-6 rounded-3xl border border-white/10 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nueva Deuda</h2>
              <button onClick={() => setShowNewDebt(false)} className="text-text-muted hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-3">
              <input 
                type="text" required placeholder="Nombre (ej. Tarjeta de Crédito)" 
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white"
                value={newDebtData.name} onChange={e => setNewDebtData({...newDebtData, name: e.target.value})}
              />
              <input 
                type="number" required placeholder="Balance Total (RD$)" 
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white"
                value={newDebtData.balance} onChange={e => setNewDebtData({...newDebtData, balance: e.target.value})}
              />
              <div className="flex space-x-3">
                <input 
                  type="number" step="0.1" placeholder="Tasa % (Anual)" 
                  className="w-1/2 bg-black/30 border border-white/10 rounded-xl p-3 text-white"
                  value={newDebtData.annual_interest_rate} onChange={e => setNewDebtData({...newDebtData, annual_interest_rate: e.target.value})}
                />
                <input 
                  type="number" placeholder="Pago Mínimo" 
                  className="w-1/2 bg-black/30 border border-white/10 rounded-xl p-3 text-white"
                  value={newDebtData.min_payment} onChange={e => setNewDebtData({...newDebtData, min_payment: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl mt-4 transition-colors">
                Guardar Deuda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulador */}
      {showSim && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass bg-surface/90 p-6 rounded-t-3xl border border-white/10 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Calculator size={24} className="text-primary" />
                <span>Acelerador de Pagos</span>
              </h2>
              <button onClick={() => setShowSim(false)} className="text-text-muted hover:text-white">✕</button>
            </div>
            
            <p className="text-sm text-text-muted mb-4 border-b border-white/10 pb-3">
              ¿Qué pasaría si haces un esfuerzo extra? Descubre cómo afecta a tu deuda de {selectedDebt.name}.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Tu Abono Extra (Mensual)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-text-muted">RD$</span>
                  <input 
                    type="number" 
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-10 text-white text-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="Ej. 1000"
                  />
                </div>
              </div>

              {extraPayment > 0 && calculateSim(selectedDebt, extraPayment).saved > 0 && (() => {
                const sim = calculateSim(selectedDebt, extraPayment);
                return (
                  <div className="bg-gradient-to-br from-success/20 to-success/5 border border-success/30 rounded-2xl p-5 mt-4">
                    <p className="text-sm text-success mb-3 font-semibold uppercase tracking-wider">Tu Plan Acelerado</p>
                    
                    <div className="space-y-3 text-sm text-white/90">
                      <div className="flex items-start">
                        <span className="mr-2">📉</span>
                        <span>Intereses ahorrados: <strong className="text-success">RD$ {sim.saved.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</strong></span>
                      </div>
                      
                      <div className="flex items-start">
                        <span className="mr-2">🗓️</span>
                        <span>Libertad financiera: <strong>{sim.releaseDate}</strong> <span className="text-success text-xs bg-success/20 px-2 py-0.5 rounded-full ml-1">{sim.monthsDiff} meses antes</span></span>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>Mínimo vs Tu plan</span>
                          <span>🚀 Más rápido</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden flex">
                          <div className="bg-white/20 h-full w-1/3"></div>
                          <div className="bg-success h-full w-2/3 shadow-[0_0_8px_#10b981]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
