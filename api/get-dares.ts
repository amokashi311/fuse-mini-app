import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query('SELECT * FROM dares ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
