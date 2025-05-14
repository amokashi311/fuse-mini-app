import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { fid } = _req.query;
    if (!fid) return res.status(400).json({ error: 'FID is required' });

    if (_req.method === 'POST') {
      const { streak, lastCompletedDate } = _req.body;
      await sql`
        INSERT INTO user_streaks (user_id, streak, last_completed_date)
        VALUES (${fid}, ${streak}, ${lastCompletedDate})
        ON CONFLICT (user_id) DO UPDATE SET
          streak = EXCLUDED.streak,
          last_completed_date = EXCLUDED.last_completed_date
      `;
      return res.status(200).json({ success: true });
    }

    const result = await sql`SELECT streak, last_completed_date FROM user_streaks WHERE user_id = ${fid}`;
    if (result.length === 0) {
      return res.status(200).json({ streak: 0, last_completed_date: null });
    }
    res.status(200).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
