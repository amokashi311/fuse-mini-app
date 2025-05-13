import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, username, profileImageUrl } = _req.body;
    await sql`
      INSERT INTO users (fid, username, profile_image_url)
      VALUES (${fid}, ${username}, ${profileImageUrl})
      ON CONFLICT (fid) DO NOTHING
    `;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
