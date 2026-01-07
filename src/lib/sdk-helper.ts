/**
 * SDK Helper Module
 *
 * Wrapper around Agent SDK's query() with pre-configured MCP servers.
 * Provides runQuery() function for autonomous workflow phases.
 *
 * MCP Servers:
 * - Tavily: Web search for research
 * - Perplexity: Web search and reasoning
 * - Context7: Documentation lookup
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

// ============================================================================
// Types
// ============================================================================

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface QueryOptions {
  systemPrompt?: string;
  mcpServers?: Record<string, MCPServerConfig>;
  allowedTools?: string[];
  maxTurns?: number;
}

// ============================================================================
// Default MCP Servers Configuration
// ============================================================================

const DEFAULT_MCP_SERVERS: Record<string, MCPServerConfig> = {
  tavily: {
    command: 'npx',
    args: ['-y', '@tavily/mcp-server'],
    env: { TAVILY_API_KEY: process.env.TAVILY_API_KEY || '' }
  },
  perplexity: {
    command: 'npx',
    args: ['-y', 'perplexity-mcp'],
    env: { PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '' }
  },
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp@1.0.34-canary.5']
  }
};

// ============================================================================
// runQuery Function
// ============================================================================

/**
 * Wrapper around Agent SDK's query() with pre-configured MCP servers.
 *
 * NOTE: MCP servers via npx don't work in Next.js serverless environments.
 * Falls back to Anthropic API directly when MCP servers fail.
 *
 * @param prompt - The prompt to send to the agent
 * @param options - Query options (systemPrompt, mcpServers, allowedTools, maxTurns)
 * @returns The final result as a string
 */
export async function runQuery(
  prompt: string,
  options: QueryOptions = {}
): Promise<string> {
  console.log('[SDK Helper] runQuery called with tools:', options.allowedTools);

  // Check if we should use Agent SDK (only if NOT in Next.js serverless environment)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

  if (isServerless) {
    console.log('[SDK Helper] Serverless environment detected, using Anthropic API fallback');
    return fallbackToAnthropicAPI(prompt, options);
  }

  // Try Agent SDK with MCP servers
  try {
    console.log('[SDK Helper] Attempting Agent SDK with MCP servers...');

    // Merge default MCP servers with custom ones
    const mcpServers = {
      ...DEFAULT_MCP_SERVERS,
      ...(options.mcpServers || {})
    };

    // Filter out servers without required API keys
    const validMcpServers: Record<string, MCPServerConfig> = {};
    for (const [name, config] of Object.entries(mcpServers)) {
      if (name === 'context7') {
        validMcpServers[name] = config;
      } else if (config.env && Object.values(config.env).some(v => v)) {
        validMcpServers[name] = config;
      } else {
        console.warn(`[SDK Helper] Skipping ${name} MCP server: missing API key`);
      }
    }

    console.log('[SDK Helper] Valid MCP servers:', Object.keys(validMcpServers));

    // Call Agent SDK's query()
    const result = await query({
      prompt,
      options: {
        systemPrompt: options.systemPrompt,
        mcpServers: validMcpServers,
        allowedTools: options.allowedTools,
        maxTurns: options.maxTurns || 3
      }
    });

    // Extract final result from async generator
    let finalResult = '';
    for await (const message of result) {
      if (message.type === 'result' && message.subtype === 'success') {
        finalResult = message.result;
      } else if (message.type === 'result' && message.subtype && message.subtype.startsWith('error_')) {
        console.error('[SDK Helper] Query error:', message.errors);
        throw new Error(message.errors?.join(', ') || 'Query failed');
      }
    }

    console.log('[SDK Helper] Query successful, result length:', finalResult.length);
    return finalResult;
  } catch (error) {
    console.error('[SDK Helper] Agent SDK failed, falling back to Anthropic API:', error);
    return fallbackToAnthropicAPI(prompt, options);
  }
}

/**
 * Fallback to direct Anthropic API when Agent SDK fails
 */
async function fallbackToAnthropicAPI(
  prompt: string,
  options: QueryOptions = {}
): Promise<string> {
  console.log('[SDK Helper] Using Anthropic API fallback');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  // Choose model based on tools
  const model = options.allowedTools && options.allowedTools.length > 0
    ? 'claude-3-5-sonnet-20241022'  // Better for tool use
    : 'claude-3-haiku-20240307';     // Faster for simple queries

  const response = await anthropic.messages.create({
    model,
    max_tokens: options.maxTurns === 1 ? 1000 : 2000,
    system: options.systemPrompt,
    messages: [{ role: 'user', content: prompt }]
  });

  const result = response.content[0]?.type === 'text'
    ? response.content[0].text
    : '';

  console.log('[SDK Helper] Anthropic API fallback successful, result length:', result.length);
  return result;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Run query with Tavily search tools for research
 */
export async function runResearchQuery(
  prompt: string,
  systemPrompt = 'You are a research assistant. Use web search tools to find current, timely information.'
): Promise<string> {
  return runQuery(prompt, {
    systemPrompt,
    allowedTools: ['tavily_search', 'perplexity_search', 'perplexity_reason', 'WebSearch'],
    maxTurns: 5
  });
}

/**
 * Run query with Context7 for documentation lookup
 */
export async function runDocsQuery(
  prompt: string,
  systemPrompt = 'You are a technical writer. Use documentation lookup tools when needed.'
): Promise<string> {
  return runQuery(prompt, {
    systemPrompt,
    allowedTools: ['context7_query-docs', 'context7_resolve-library-id'],
    maxTurns: 2
  });
}

/**
 * Run query without tools (analysis only)
 */
export async function runAnalysisQuery(
  prompt: string,
  systemPrompt = 'You are an analyst. Respond with clear, structured output.'
): Promise<string> {
  return runQuery(prompt, {
    systemPrompt,
    allowedTools: [],
    maxTurns: 1
  });
}
