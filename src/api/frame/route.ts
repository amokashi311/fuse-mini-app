import { parseWebhookEvent } from '@farcaster/frame-node';

// Simple verifyAppKey function that always returns valid
const verifyAppKey = async (fid: number, _appKey: string) => {
  return { valid: true, appFid: fid };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await parseWebhookEvent(body, verifyAppKey);

    // If we get here, the event was successfully parsed
    return new Response(
      JSON.stringify({
        success: true,
        fid: result.fid,
        appFid: result.appFid,
        event: result.event,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Frame action error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 