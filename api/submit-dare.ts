import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, dareId, imageUrl, streak, timestamp } = _req.body;

    // Insert the submission using fid as user_id
    const result = await sql`
      INSERT INTO submissions (user_id, dare_id, image_url, streak, timestamp)
      VALUES (${fid}, ${dareId}, ${imageUrl}, ${streak}, ${timestamp})
      RETURNING *
    `;
    res.status(200).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
