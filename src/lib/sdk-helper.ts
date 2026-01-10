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
// Environment Validation
// ============================================================================

function validateEnvironment(): void {
  // Check for any valid auth token (API key, auth token, or OAuth token)
  const hasApiKey = process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.includes('your-key') &&
    process.env.ANTHROPIC_API_KEY.length > 20;

  const hasAuthToken = process.env.ANTHROPIC_AUTH_TOKEN &&
    process.env.ANTHROPIC_AUTH_TOKEN.length > 20;

  const hasCliToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;

  if (!hasApiKey && !hasAuthToken && !hasCliToken) {
    console.warn('[SDK Helper] No auth token found. Queries may fail.');
  } else if (hasApiKey) {
    console.log('[SDK Helper] Environment validated: ANTHROPIC_API_KEY ✓ (will use Agent SDK)');
  } else if (hasAuthToken) {
    console.log('[SDK Helper] Environment validated: ANTHROPIC_AUTH_TOKEN ✓ (will use Agent SDK)');
  } else {
    console.log('[SDK Helper] Environment validated: CLAUDE_CODE_OAUTH_TOKEN ✓ (will use Claude Code CLI)');
  }
}

// Validate on module load
if (typeof window === 'undefined') {
  // Only validate in Node.js environment (not browser)
  validateEnvironment();
}

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

  // Check for any valid auth token (API key, auth token, or OAuth token)
  const hasApiKey = process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.includes('your-key') &&
    process.env.ANTHROPIC_API_KEY.length > 20;

  const hasAuthToken = process.env.ANTHROPIC_AUTH_TOKEN &&
    process.env.ANTHROPIC_AUTH_TOKEN.length > 20;

  const hasValidApiKey = hasApiKey || hasAuthToken;

  // Check if we should use Agent SDK (only if API key is valid AND not in serverless)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

  if (isServerless || !hasValidApiKey) {
    if (!hasValidApiKey) {
      console.log('[SDK Helper] No valid auth token found, using Claude Code CLI');
    } else {
      console.log('[SDK Helper] Serverless environment detected, using Claude Code CLI');
    }
    return fallbackToClaudeCodeCLI(prompt, options);
  }

  // If no tools allowed, use Claude Code CLI (no need for Agent SDK)
  if (!options.allowedTools || options.allowedTools.length === 0) {
    console.log('[SDK Helper] No tools allowed, using Claude Code CLI (skipping Agent SDK)');
    return fallbackToClaudeCodeCLI(prompt, options);
  }

  // Try Agent SDK with MCP servers (only when API key is valid AND tools are needed)
  try {
    console.log('[SDK Helper] Valid API key found, attempting Agent SDK with MCP servers...');

    // Load MCP servers for tool use
    // Merge default MCP servers with custom ones
    const mcpServers = {
      ...DEFAULT_MCP_SERVERS,
      ...(options.mcpServers || {})
    };

    // Filter out servers without required API keys
    let validMcpServers: Record<string, MCPServerConfig> = {};
    const skippedServers: string[] = [];

    for (const [name, config] of Object.entries(mcpServers)) {
      if (name === 'context7') {
        validMcpServers[name] = config;
        console.log(`[SDK Helper] ✓ Including ${name} MCP server (no API key required)`);
      } else if (config.env && Object.values(config.env).some(v => v)) {
        validMcpServers[name] = config;
        console.log(`[SDK Helper] ✓ Including ${name} MCP server`);
      } else {
        skippedServers.push(name);
        console.warn(`[SDK Helper] ✗ Skipping ${name} MCP server: missing API key`);
      }
    }

    console.log(`[SDK Helper] MCP servers ready: [${Object.keys(validMcpServers).join(', ')}]`);
    if (skippedServers.length > 0) {
      console.warn(`[SDK Helper] Skipped servers: [${skippedServers.join(', ')}]`);
    }

    // Call Agent SDK's query()
    console.log('[SDK Helper] Calling Agent SDK with:');
    console.log('[SDK Helper] - allowedTools:', options.allowedTools);
    console.log('[SDK Helper] - mcpServers:', Object.keys(validMcpServers));
    console.log('[SDK Helper] - maxTurns:', options.maxTurns || 3);
    console.log('[SDK Helper] - prompt length:', prompt.length);

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
    let messageCount = 0;

    for await (const message of result) {
      messageCount++;

      if (message.type === 'result') {
        console.log(`[SDK Helper] Message ${messageCount}: result - subtype: ${message.subtype}`);
        if (message.subtype === 'success') {
          finalResult = message.result;
          console.log('[SDK Helper] Query successful, result length:', finalResult.length);
          console.log('[SDK Helper] Result preview:', finalResult.slice(0, 200) + (finalResult.length > 200 ? '...' : ''));
          break; // Exit loop after success
        } else {
          // Handle all error subtypes
          console.error('[SDK Helper] Query error (subtype: ' + message.subtype + '):', message.errors);
          throw new Error(message.errors?.join(', ') || `Query failed with subtype: ${message.subtype}`);
        }
      } else if (message.type === 'assistant') {
        // Log assistant message with tool use and text content
        const content = message.message.content;
        for (const block of content) {
          if (block.type === 'tool_use') {
            console.log('[SDK Helper] Tool use:', block.name, '- input keys:', Object.keys(block.input || {}).join(', '));
          } else if (block.type === 'text') {
            console.log('[SDK Helper] Text message length:', block.text.length);
          }
        }
      } else {
        console.log(`[SDK Helper] Message ${messageCount}: type=${message.type}`);
      }
    }

    console.log(`[SDK Helper] Async generator completed after ${messageCount} messages`);

    if (!finalResult) {
      throw new Error('Query returned no result');
    }

    return finalResult;
  } catch (error) {
    console.error('[SDK Helper] Agent SDK failed, falling back to Anthropic API:', error);
    return fallbackToAnthropicAPI(prompt, options);
  }
}

/**
 * Fallback to Claude Code OAuth token when API key unavailable
 * Uses Anthropic SDK directly with OAuth token instead of Claude CLI
 */
async function fallbackToClaudeCodeCLI(
  prompt: string,
  options: QueryOptions = {}
): Promise<string> {
  console.log('[SDK Helper] Using Claude Code OAuth token fallback');

  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN ||
    process.env.ANTHROPIC_AUTH_TOKEN ||
    process.env.ANTHROPIC_API_KEY;

  if (!oauthToken) {
    console.error('[SDK Helper] No auth token found');
    throw new Error('No auth token available');
  }

  try {
    console.log('[SDK Helper] Calling Anthropic API with OAuth token...');

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: oauthToken, // OAuth tokens work as API keys
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

    if (!result) {
      throw new Error('OAuth token API returned empty response');
    }

    console.log('[SDK Helper] OAuth token API successful, result length:', result.length);
    return result.trim();
  } catch (error) {
    console.error('[SDK Helper] OAuth token API failed:', error);
    throw error; // Don't fall back further - we've exhausted options
  }
}

/**
 * Fallback to direct Anthropic API
 * Only called if API key was already validated and available
 */
async function fallbackToAnthropicAPI(
  prompt: string,
  options: QueryOptions = {}
): Promise<string> {
  console.log('[SDK Helper] Using Anthropic API directly');

  const apiKey = process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_AUTH_TOKEN;

  if (!apiKey) {
    throw new Error('[SDK Helper] No auth token available for Anthropic API fallback');
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({
    apiKey,
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

  console.log('[SDK Helper] Anthropic API successful, result length:', result.length);
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
  systemPrompt = 'You are a research assistant. You MUST use the MCP search tools (mcp__tavily__search, mcp__perplexity__search, or mcp__perplexity__reason) for web search. Do NOT use the built-in WebSearch tool - use the MCP search tools instead.'
): Promise<string> {
  return runQuery(prompt, {
    systemPrompt,
    allowedTools: ['mcp__tavily__search', 'mcp__perplexity__search', 'mcp__perplexity__reason'],
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
