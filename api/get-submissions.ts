import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { dareId } = _req.query;
  if (!dareId) return res.status(400).json({ error: 'dareId is required' });
  try {
    const result = await sql`
      SELECT s.*, u.username, u.profile_image_url
      FROM submissions s
      JOIN users u ON s.user_id = u.fid
      WHERE s.dare_id = ${dareId}
      ORDER BY s.timestamp DESC
      LIMIT 25
    `;
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
