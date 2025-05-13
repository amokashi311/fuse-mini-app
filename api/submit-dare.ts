import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (_req.method !== 'POST') return res.status(405).end();

  try {
    const { fid, dareId, imageUrl, streak, timestamp, username, displayName, profileImageUrl } = _req.body;

    // 1. Upsert the user
    await sql`
      INSERT INTO users (fid, username, display_name, profile_image_url)
      VALUES (${fid}, ${username}, ${displayName}, ${profileImageUrl})
      ON CONFLICT (fid) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        profile_image_url = EXCLUDED.profile_image_url
    `;

    // 2. Fetch the user's serial id
    const userResult = await sql`SELECT id FROM users WHERE fid = ${fid}`;
    const userId = userResult[0]?.id;
    if (!userId) {
      return res.status(400).json({ error: 'User not found or could not be created.' });
    }

    // 3. Insert the submission
    const result = await sql`
      INSERT INTO submissions (user_id, dare_id, image_url, streak, timestamp)
      VALUES (${userId}, ${dareId}, ${imageUrl}, ${streak}, ${timestamp})
      RETURNING *
    `;
    res.status(200).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
