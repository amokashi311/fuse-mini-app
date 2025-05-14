import type { VercelRequest, VercelResponse } from '@vercel/node';
// import your db client here
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  // Fetch submission from DB
  const result = await sql`
    SELECT s.*, u.username
    FROM submissions s
    LEFT JOIN users u ON s.user_id = u.fid
    WHERE s.id = ${id}
    LIMIT 1
  `;
  const submission = result[0];

  if (!submission) {
    res.status(404).send('Not found');
    return;
  }

  // Build the frame meta tag
  const frameEmbed = {
    version: 'next',
    imageUrl: submission.image_url,
    button: {
      title: 'Open in Fuse',
      action: {
        type: 'launch_frame',
        name: 'Fuse',
        url: `https://fuse-mini-app.vercel.app/?submission=${submission.id}`,
        splashImageUrl: 'https://fuse-mini-app.vercel.app/splash.png',
        splashBackgroundColor: '#eeccff'
      }
    }
  };

  // Return HTML with meta tag
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="fc:frame" content='${JSON.stringify(frameEmbed)}' />
        <title>Fuse Submission</title>
      </head>
      <body>
        <h1>Fuse Submission</h1>
        <img src="${submission.image_url}" alt="Submission" style="max-width:100%;" />
        <p>By: ${submission.username}</p>
      </body>
    </html>
  `);
}
