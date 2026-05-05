import { create } from 'zustand'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

localforage.config({
  name: 'FianzaApp',
  storeName: 'appData'
})

export const useStore = create((set, get) => ({
  balance: 0,
  budget: 0, 
  transactions: [],
  debts: [],
  subscriptions: [],
  focusMode: false,
  
  categories: [
    { id: '1', name: 'Comida', icon: '🍔', type: 'expense' },
    { id: '2', name: 'Transporte', icon: '🚗', type: 'expense' },
    { id: '3', name: 'Servicios', icon: '💡', type: 'expense' },
    { id: '4', name: 'Ocio', icon: '🎉', type: 'expense' },
    { id: 'debt_payment', name: 'Deuda', icon: '💳', type: 'expense' },
    { id: '5', name: 'Salario', icon: '💰', type: 'income' },
  ],

  toggleFocusMode: () => set((state) => {
    const newState = !state.focusMode;
    localforage.setItem('focusMode', newState);
    return { focusMode: newState };
  }),

  setBudget: (amount) => set(() => {
    localforage.setItem('budget', amount);
    return { budget: amount };
  }),

  addDebt: async (debt) => {
    const newDebt = { ...debt, id: uuidv4(), created_at: new Date().toISOString() };
    set((state) => {
      const newDebts = [...state.debts, newDebt];
      localforage.setItem('debts', newDebts);
      return { debts: newDebts };
    });
  },

  payDebt: async (debtId, amount, date) => {
    const { debts, addTransaction } = get();
    const debtIndex = debts.findIndex(d => d.id === debtId);
    if (debtIndex === -1) return;

    // 1. Reducir el balance de la deuda
    const newDebts = [...debts];
    newDebts[debtIndex] = {
      ...newDebts[debtIndex],
      balance: Math.max(0, newDebts[debtIndex].balance - amount)
    };
    
    set({ debts: newDebts });
    localforage.setItem('debts', newDebts);

    // 2. Registrar como un gasto normal en el presupuesto
    await addTransaction(amount, 'expense', 'debt_payment', `Pago a ${newDebts[debtIndex].name}`, date);
  },

  addTransaction: async (amount, type, categoryId, note = '', dateStr = null) => {
    const newTx = {
      id: uuidv4(),
      amount: parseFloat(amount),
      type,
      category_id: categoryId,
      date: dateStr || new Date().toISOString().split('T')[0],
      note,
      is_synced: false,
      created_at: new Date().toISOString()
    };

    set((state) => {
      const newTransactions = [newTx, ...state.transactions];
      const newBalance = type === 'income' 
        ? state.balance + newTx.amount 
        : state.balance - newTx.amount;
        
      localforage.setItem('offline_transactions', newTransactions);
      return { transactions: newTransactions, balance: newBalance };
    });
  },

  addSubscription: async (sub) => {
    const newSub = { ...sub, id: uuidv4(), created_at: new Date().toISOString() };
    set((state) => {
      const newSubs = [...state.subscriptions, newSub];
      localforage.setItem('subscriptions', newSubs);
      return { subscriptions: newSubs };
    });
  },

  initStore: async () => {
    const savedTxs = await localforage.getItem('offline_transactions') || [];
    const savedDebts = await localforage.getItem('debts') || [];
    const savedSubs = await localforage.getItem('subscriptions') || [];
    const savedBudget = await localforage.getItem('budget') || 0;
    const savedFocus = await localforage.getItem('focusMode') || false;

    // Lógica de Suscripciones: previene duplicados comprobando mes actual
    let updatedTxs = [...savedTxs];
    let subsChanged = false;
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const todayDay = today.getDate();

    const processedSubs = savedSubs.map(sub => {
      if (sub.day_of_month <= todayDay && sub.last_processed !== currentMonthKey) {
        // Ejecutar suscripción
        const newTx = {
          id: uuidv4(),
          amount: parseFloat(sub.amount),
          type: 'expense',
          category_id: sub.category_id,
          date: new Date(today.getFullYear(), today.getMonth(), sub.day_of_month).toISOString().split('T')[0],
          note: `Suscripción: ${sub.name}`,
          is_synced: false,
          created_at: new Date().toISOString()
        };
        updatedTxs.unshift(newTx);
        subsChanged = true;
        return { ...sub, last_processed: currentMonthKey };
      }
      return sub;
    });

    if (subsChanged) {
      localforage.setItem('offline_transactions', updatedTxs);
      localforage.setItem('subscriptions', processedSubs);
    }

    const balance = updatedTxs.reduce((acc, tx) => {
      return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
    }, 0);
    
    set({ 
      transactions: updatedTxs, 
      debts: savedDebts,
      subscriptions: processedSubs,
      budget: savedBudget,
      focusMode: savedFocus,
      balance 
    });
  }
}));
