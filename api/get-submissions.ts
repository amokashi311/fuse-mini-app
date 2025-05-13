import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const result = await sql`SELECT * FROM submissions ORDER BY timestamp DESC LIMIT 10`;
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
}
