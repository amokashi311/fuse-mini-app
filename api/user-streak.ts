import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { fid } = req.query;

  if (req.method === 'GET') {
    // Get streak
    const userResult = await pool.query('SELECT id FROM users WHERE fid = $1', [fid]);
    if (userResult.rows.length === 0) return res.status(404).json({ streak: 0, lastCompletedDate: null });
    const userId = userResult.rows[0].id;

    const streakResult = await pool.query('SELECT * FROM user_streaks WHERE user_id = $1', [userId]);
    if (streakResult.rows.length === 0) return res.status(404).json({ streak: 0, lastCompletedDate: null });
    res.status(200).json(streakResult.rows[0]);
  } else if (req.method === 'POST') {
    // Update streak
    const { streak, lastCompletedDate } = req.body;
    const userResult = await pool.query('SELECT id FROM users WHERE fid = $1', [fid]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const userId = userResult.rows[0].id;

    await pool.query(
      `INSERT INTO user_streaks (user_id, streak, last_completed_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET streak = $2, last_completed_date = $3`,
      [userId, streak, lastCompletedDate]
    );
    res.status(200).json({ success: true });
  } else {
    res.status(405).end();
  }
}
