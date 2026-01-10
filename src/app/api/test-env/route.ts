import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tavily: !!process.env.TAVILY_API_KEY,
    tavilyLength: process.env.TAVILY_API_KEY?.length || 0,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    perplexityLength: process.env.PERPLEXITY_API_KEY?.length || 0,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
  });
}
