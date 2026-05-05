import { useState } from 'react';
import Numpad from '../components/Numpad';
import CategorySelector from '../components/CategorySelector';
import { useStore } from '../store/useStore';

export default function CapturePage() {
  const [amount, setAmount] = useState('0');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  
  const { balance, addTransaction, focusMode } = useStore();

  const handleCategorySelect = (category) => {
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return;

    addTransaction(numericAmount, category.type, category.id, '', dateStr);
    setAmount('0');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-end p-4 pb-20 space-y-6">
      {!focusMode && (
        <div className="absolute top-4 left-4 right-4 text-center">
          <p className="text-sm text-text-muted">Balance Disponible</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-text' : 'text-danger'}`}>
            RD$ {balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      <div className="flex justify-end items-end px-4 h-20">
        <span className="text-3xl text-text-muted mr-2 pb-1">RD$</span>
        <span className={`text-6xl font-bold tracking-tighter ${amount === '0' ? 'text-text-muted/50' : 'text-white'}`}>
          {amount}
        </span>
      </div>

      <div className="flex justify-center mb-2">
        <input 
          type="date" 
          value={dateStr}
          onChange={(e) => setDateStr(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-sm text-text-muted focus:text-white focus:outline-none"
        />
      </div>

      <Numpad value={amount} onChange={setAmount} />
      
      <div className="relative">
        {showToast && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-success text-white px-4 py-2 rounded-full font-medium shadow-lg animate-bounce z-50">
            ¡Registrado!
          </div>
        )}
        <h3 className="px-4 text-sm font-semibold text-text-muted mb-2 uppercase tracking-wider">
          {parseFloat(amount) > 0 ? 'Selecciona para guardar' : 'Categorías'}
        </h3>
        <CategorySelector 
          onSelect={handleCategorySelect} 
          disabled={parseFloat(amount) <= 0} 
        />
      </div>
    </div>
  );
}
