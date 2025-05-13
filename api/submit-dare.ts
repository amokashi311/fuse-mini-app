import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, dareId, imageUrl, streak, timestamp, username, displayName, profileImageUrl } = _req.body;
    // Insert submission
    await sql`
      INSERT INTO users (fid, username, display_name, profile_image_url)
      VALUES (${fid}, ${username}, ${displayName}, ${profileImageUrl})
      ON CONFLICT (fid) DO NOTHING
    `;
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
