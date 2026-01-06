import { NextResponse } from 'next/server';
import { defaultTools } from '@/lib/agent';

export async function POST() {
  try {
    console.log('[Test] Calling post_now tool directly...');

    const postNowTool = defaultTools.find(t => t.name === 'post_now');
    if (!postNowTool) {
      return NextResponse.json({ error: 'post_now tool not found' }, { status: 404 });
    }

    const result = await postNowTool.execute({
      content: 'Test tweet from backend',
    });

    console.log('[Test] Post result:', result);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Test] Post error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
