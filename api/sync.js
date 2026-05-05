import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { transactions, debts, subscriptions } = req.body;
    const syncResults = {};

    // 1. Sync Transacciones
    if (transactions && transactions.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .upsert(transactions, { onConflict: 'id' });
      if (error) throw error;
      syncResults.transactions = transactions.length;
    }

    // 2. Sync Deudas
    if (debts && debts.length > 0) {
      const { error } = await supabase
        .from('debts')
        .upsert(debts, { onConflict: 'id' });
      if (error) throw error;
      syncResults.debts = debts.length;
    }

    // 3. Sync Suscripciones
    if (subscriptions && subscriptions.length > 0) {
      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptions, { onConflict: 'id' });
      if (error) throw error;
      syncResults.subscriptions = subscriptions.length;
    }

    return res.status(200).json({ success: true, synced: syncResults });
  } catch (error) {
    console.error('Error sincronizando:', error);
    return res.status(500).json({ error: error.message });
  }
}
