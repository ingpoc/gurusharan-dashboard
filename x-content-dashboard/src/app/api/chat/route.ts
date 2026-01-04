import { NextRequest } from 'next/server';
import { ContentCreatorAgent, defaultTools } from '@/lib/agent';

export const runtime = 'edge';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set');
}

// Create agent instance
const agent = new ContentCreatorAgent(apiKey || '', defaultTools);

interface ChatRequest {
  message: string;
  stream?: boolean;
}

/**
 * POST /api/chat
 * Handles chat requests with Agent SDK tool support and SSE streaming
 */
export async function POST(req: NextRequest) {
  try {
    const { message, stream = true }: ChatRequest = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!stream) {
      // Non-streaming response (collect all events)
      const chunks: string[] = [];
      const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

      for await (const event of agent.streamMessage(message)) {
        if (event.type === 'text') {
          chunks.push(event.content);
        } else if (event.type === 'tool_use') {
          toolCalls.push({
            name: event.toolName || 'unknown',
            input: event.toolInput || {},
          });
        }
      }

      return new Response(
        JSON.stringify({
          content: chunks.join(''),
          toolCalls,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Streaming response with Server-Sent Events
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of agent.streamMessage(message)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }

          // Send done event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                content: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
