import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { fid, dareId, imageUrl, streak, timestamp } = req.body;

  try {
    // Get user_id
    const userResult = await pool.query('SELECT id FROM users WHERE fid = $1', [fid]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const userId = userResult.rows[0].id;

    // Insert submission
    await pool.query(
      'INSERT INTO submissions (user_id, dare_id, image_url, timestamp, streak) VALUES ($1, $2, $3, $4, $5)',
      [userId, dareId, imageUrl, timestamp || new Date().toISOString(), streak]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
