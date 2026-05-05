import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS Headers para permitir que el frontend (Vite) llame a la API
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
    const { transactions } = req.body; // Esperamos un array de transacciones para el offline-sync

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Formato inválido. Se esperaba un array de transacciones.' });
    }

    // Insertar en Supabase
    // Asumimos que los UUIDs vienen generados desde el frontend
    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactions, { onConflict: 'id' });

    if (error) throw error;

    return res.status(200).json({ success: true, synced: transactions.length });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return res.status(500).json({ error: error.message });
  }
}
