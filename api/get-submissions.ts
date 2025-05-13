import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './db.ts';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { rows } = await pool.query('SELECT * FROM submissions ORDER BY timestamp DESC LIMIT 10');
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
