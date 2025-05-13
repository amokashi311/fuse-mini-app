import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './db.ts';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, dareId, imageUrl, streak, timestamp } = _req.body;
    
    // First, get or create user
    const userResult = await pool.query(
      'INSERT INTO users (fid) VALUES ($1) ON CONFLICT (fid) DO NOTHING RETURNING id',
      [fid]
    );
    
    // Then insert submission
    const submissionResult = await pool.query(
      'INSERT INTO submissions (user_id, dare_id, image_url, streak, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userResult.rows[0]?.id || fid, dareId, imageUrl, streak, timestamp]
    );
    
    res.status(200).json(submissionResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
