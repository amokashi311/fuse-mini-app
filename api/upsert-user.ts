import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, username, displayName, profileImageUrl } = _req.body;
    await sql`
      INSERT INTO users (fid, username, display_name, profile_image_url)
      VALUES (${fid}, ${username}, ${displayName}, ${profileImageUrl})
      ON CONFLICT (fid) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        profile_image_url = EXCLUDED.profile_image_url
    `;
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
