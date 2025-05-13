import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { fid } = _req.query;
    if (!fid) return res.status(400).json({ error: 'FID is required' });

    if (_req.method === 'POST') {
      const { streak, lastCompletedDate } = _req.body;
      await pool.query(
        'UPDATE user_streaks SET streak = $1, last_completed_date = $2 WHERE fid = $3',
        [streak, lastCompletedDate, fid]
      );
      return res.status(200).json({ success: true });
    }

    const { rows } = await pool.query(
      'SELECT streak, last_completed_date FROM user_streaks WHERE fid = $1',
      [fid]
    );
    
    if (rows.length === 0) {
      return res.status(200).json({ streak: 0, last_completed_date: null });
    }
    
    res.status(200).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
