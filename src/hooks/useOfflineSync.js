import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useOfflineSync() {
  const transactions = useStore((state) => state.transactions);
  const debts = useStore((state) => state.debts);
  const subscriptions = useStore((state) => state.subscriptions);
  
  useEffect(() => {
    const syncData = async () => {
      // Find transactions that are not synced yet
      const unsyncedTxs = transactions.filter(tx => !tx.is_synced);
      
      // En una versión más avanzada añadirías is_synced a debts y subscriptions
      // Por el MVP enviaremos todos porque el backend hace 'upsert'
      const debtsToSync = debts; 
      const subsToSync = subscriptions;

      if (unsyncedTxs.length === 0 && debtsToSync.length === 0 && subsToSync.length === 0) return;
      if (!navigator.onLine) return; // Wait for connection

      try {
        // Enviar al nuevo endpoint unificado
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            transactions: unsyncedTxs,
            debts: debtsToSync,
            subscriptions: subsToSync
          })
        });

        if (res.ok) {
          const result = await res.json();
          console.log('Sincronización exitosa:', result.synced);
        }
      } catch (error) {
        console.error('Error sincronizando en background:', error);
      }
    };

    // Intentar sincronizar cada vez que haya un cambio en transacciones o se recupere la red
    syncData();
    
    window.addEventListener('online', syncData);
    return () => window.removeEventListener('online', syncData);
  }, [transactions]);
}
