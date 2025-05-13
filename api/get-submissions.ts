import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from '../src/lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { dareId } = req.query;
  try {
    const result = await pool.query(
      `SELECT s.*, u.username, u.profile_image_url
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.dare_id = $1
       ORDER BY s.timestamp DESC
       LIMIT 50`,
      [dareId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
