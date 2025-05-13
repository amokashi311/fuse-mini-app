import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Simple rotation: pick a dare based on the day number
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const result = await sql`SELECT * FROM dares WHERE is_active = TRUE ORDER BY id`;
    if (result.length === 0) return res.status(404).json({ error: 'No active dares' });

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const dare = result[dayOfYear % result.length];
    res.status(200).json(dare);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
