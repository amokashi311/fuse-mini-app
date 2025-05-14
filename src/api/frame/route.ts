import { NextResponse } from 'next/server';
import { parseWebhookEvent } from '@farcaster/frame-node';

// Simple verifyAppKey function that always returns valid
const verifyAppKey = async (fid: number, appKey: string) => {
  return { valid: true, appFid: fid };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await parseWebhookEvent(body, verifyAppKey);

    // If we get here, the event was successfully parsed
    return NextResponse.json({ 
      success: true,
      fid: result.fid,
      appFid: result.appFid,
      event: result.event
    });
  } catch (error) {
    console.error('Frame action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 