import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Simple rotation: pick a dare based on the day number
  try {
    const { rows } = await pool.query('SELECT * FROM dares WHERE is_active = TRUE ORDER BY id');
    if (rows.length === 0) return res.status(404).json({ error: 'No active dares' });

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const dare = rows[dayOfYear % rows.length];
    res.status(200).json(dare);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
