import type { VercelRequest, VercelResponse } from '@vercel/node';
import { pool } from './db.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { fid, username, displayName, profileImageUrl } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (fid, username, display_name, profile_image_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (fid) DO UPDATE SET username = $2, display_name = $3, profile_image_url = $4
       RETURNING *`,
      [fid, username, displayName, profileImageUrl]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
