import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from './db';
import { TwitterApi } from 'twitter-api-v2';
import { refreshAccessToken } from './x-oauth';
import { getMCPToolDefinitions } from './mcp-bridge';

// ============================================================================
// Tool Schemas (Zod)
// ============================================================================

export const GetSettingsSchema = z.object({
  userId: z.string().optional().describe('User ID (optional, defaults to current user)'),
});

export const DraftPostSchema = z.object({
  topic: z.string().describe('The topic to write about'),
  tone: z.string().optional().describe('Tone for the post (e.g., professional, casual, excited)'),
  hashtags: z.boolean().optional().describe('Include hashtags (default: true)'),
  length: z.enum(['short', 'medium', 'long']).optional().describe('Post length'),
});

export const PostNowSchema = z.object({
  content: z.string().describe('The content to post'),
  scheduledFor: z.string().optional().describe('ISO datetime string for scheduling'),
});

export const ResearchTopicSchema = z.object({
  topic: z.string().describe('Topic to research'),
  maxResults: z.number().optional().describe('Maximum results to return (default: 5)'),
});

export const SaveDraftSchema = z.object({
  content: z.string().describe('Draft content to save'),
  title: z.string().optional().describe('Optional title for the draft'),
});

export const GetDraftsSchema = z.object({
  limit: z.number().optional().describe('Maximum drafts to return (default: 10)'),
});

// ============================================================================
// Tool Definitions for Agent
// ============================================================================

export interface ToolDefinition<TInput = unknown, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: unknown) => Promise<TResult>;
}

export interface ToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<{ type: 'text'; text: string }>;
}

// ============================================================================
// Custom Agent Implementation
// ============================================================================

export class ContentCreatorAgent {
  private anthropic: Anthropic;
  private tools: Map<string, ToolDefinition>;
  private systemPrompt: string;

  constructor(apiKey: string, tools: ToolDefinition[]) {
    this.anthropic = new Anthropic({ apiKey });
    this.tools = new Map(
      tools.map((tool) => [tool.name, tool])
    );
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Load MCP tools from remote servers and merge with existing tools
   */
  async loadMCPTools(): Promise<void> {
    console.log('[Agent] Loading MCP tools...');

    try {
      const mcpTools = await getMCPToolDefinitions();

      for (const tool of mcpTools) {
        // Add MCP tools with prefix to avoid naming conflicts
        const existingTool = this.tools.get(tool.name);
        if (existingTool) {
          console.log(`[Agent] Tool ${tool.name} already exists, skipping`);
          continue;
        }

        this.tools.set(tool.name, tool);
        console.log(`[Agent] Loaded MCP tool: ${tool.name}`);
      }

      // Rebuild system prompt with new tools
      this.systemPrompt = this.buildSystemPrompt();

      console.log(`[Agent] MCP tools loaded. Total tools: ${this.tools.size}`);
    } catch (error) {
      console.error('[Agent] Failed to load MCP tools:', error);
      // Continue without MCP tools - graceful degradation
      console.log('[Agent] Continuing with local tools only');
    }
  }

  private buildSystemPrompt(): string {
    const toolDescriptions = Array.from(this.tools.values())
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `You are an AI content creation assistant for @techtrends3107, an X (Twitter) account focused on AI and technology trends.

Your available tools:
${toolDescriptions}

CRITICAL: You MUST use these tools to perform actions:
- When user asks to "post" or "tweet", you MUST call the post_now tool with the content
- When user asks to "draft" or "write", you can use draft_post to generate content
- NEVER pretend to have performed an action - always use the actual tools
- Always wait for tool results before confirming actions are complete

When drafting posts:
- Keep them concise and engaging (under 280 characters when possible)
- Use relevant hashtags
- Match the requested tone
- Focus on value for the audience

When researching:
- Find current and trending information
- Summarize key points
- Cite sources when relevant

Always ask for clarification if the request is unclear.`;
  }

  /**
   * Convert Agent SDK tools to Anthropic API format
   */
  private getAnthropicTools() {
    const tools = Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodToAnthropicSchema(tool.inputSchema),
    }));
    console.log('[Agent] Tools for Anthropic:', JSON.stringify(tools, null, 2));
    return tools;
  }

  /**
   * Convert Zod schema to Anthropic-compatible JSON schema
   */
  private zodToAnthropicSchema(schema: z.ZodType): {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  } {
    if (schema instanceof z.ZodObject) {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(schema.shape)) {
        const def = (value as z.ZodTypeAny)._def;
        properties[key] = this.getZodTypeSchema(value);

        if (!this.isZodOptional(value)) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: 'object' };
  }

  private getZodTypeSchema(zodType: z.ZodTypeAny): Record<string, unknown> {
    const def = zodType._def;

    if (zodType instanceof z.ZodString) {
      return { type: 'string' };
    }
    if (zodType instanceof z.ZodNumber) {
      return { type: 'number' };
    }
    if (zodType instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }
    if (zodType instanceof z.ZodEnum) {
      return { type: 'string', enum: (def as unknown as { values: string[] }).values };
    }
    if (zodType instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.getZodTypeSchema((def as unknown as { type: z.ZodTypeAny }).type),
      };
    }
    if (zodType instanceof z.ZodOptional) {
      return this.getZodTypeSchema((def as unknown as { innerType: z.ZodTypeAny }).innerType);
    }

    return { type: 'string' };
  }

  private isZodOptional(zodType: z.ZodTypeAny): boolean {
    return zodType instanceof z.ZodOptional;
  }

  /**
   * Execute a tool call
   */
  private async executeTool(toolUse: ToolUse): Promise<ToolResult> {
    console.log('[Agent] Executing tool:', toolUse.name, 'with input:', toolUse.input);
    const tool = this.tools.get(toolUse.name);

    if (!tool) {
      console.log('[Agent] Tool not found:', toolUse.name);
      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Error: Unknown tool "${toolUse.name}"`,
      };
    }

    try {
      const validatedInput = tool.inputSchema.parse(toolUse.input);
      console.log('[Agent] Tool input validated, executing...');
      const result = await tool.execute(validatedInput);
      console.log('[Agent] Tool execution result:', typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result);

      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      console.error('[Agent] Tool execution error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Error: ${errorMessage}`,
      };
    }
  }

  /**
   * Stream a response with tool use support
   */
  async *streamMessage(userMessage: string): AsyncGenerator<{
    type: 'text' | 'tool_use' | 'tool_result' | 'error';
    content: string;
    toolName?: string;
    toolInput?: Record<string, unknown>;
  }> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ];

    const toolResults: Array<{ toolUseId: string; result: ToolResult }> = [];
    let accumulatedText = '';

    // For accumulating tool input from input_json_delta events
    let pendingToolUse: { id: string; name: string; inputAccumulator: string } | null = null;

    try {
      // Create message with tools
      const stream = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: this.systemPrompt,
        messages,
        tools: this.getAnthropicTools(),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block?.type === 'tool_use') {
            // Start accumulating tool input
            pendingToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputAccumulator: '',
            };
            console.log('[Agent] Tool use started:', pendingToolUse.name);
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            accumulatedText += event.delta.text;
            yield {
              type: 'text',
              content: event.delta.text,
            };
          } else if (event.delta.type === 'input_json_delta' && pendingToolUse) {
            // Accumulate JSON chunks for tool input
            pendingToolUse.inputAccumulator += event.delta.partial_json;
            console.log('[Agent] Tool input chunk received, length:', event.delta.partial_json.length);
          }
        } else if (event.type === 'content_block_stop') {
          // Tool input is complete, parse and execute
          if (pendingToolUse) {
            try {
              const toolInput = JSON.parse(pendingToolUse.inputAccumulator);
              console.log('[Agent] Executing tool:', pendingToolUse.name, 'with input:', toolInput);

              const toolUse: ToolUse = {
                type: 'tool_use',
                id: pendingToolUse.id,
                name: pendingToolUse.name,
                input: toolInput,
              };

              const result = await this.executeTool(toolUse);
              toolResults.push({ toolUseId: pendingToolUse.id, result });

              yield {
                type: 'tool_result',
                content: typeof result.content === 'string'
                  ? result.content
                  : JSON.stringify(result.content),
              };
            } catch (error) {
              console.error('[Agent] Tool execution error:', error);
              yield {
                type: 'error',
                content: error instanceof Error ? error.message : 'Tool execution failed',
              };
            } finally {
              pendingToolUse = null;
            }
          }
        }
      }

      // If we executed tools, continue conversation with results
      if (toolResults.length > 0) {
        const toolResultMessages: Anthropic.MessageParam[] = [
          ...messages,
          {
            role: 'assistant',
            content: accumulatedText || 'I\'ll help you with that.',
          },
          {
            role: 'user',
            content: toolResults.map((tr) => ({
              type: 'tool_result' as const,
              tool_use_id: tr.toolUseId,
              content: tr.result.content,
            })),
          },
        ];

        // Get final response after tool execution
        const finalStream = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: this.systemPrompt,
          messages: toolResultMessages,
          stream: true,
        });

        accumulatedText = '';
        for await (const finalEvent of finalStream) {
          if (finalEvent.type === 'content_block_delta' &&
              finalEvent.delta.type === 'text_delta') {
            accumulatedText += finalEvent.delta.text;
            yield {
              type: 'text',
              content: finalEvent.delta.text,
            };
          }
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

}

// ============================================================================
// Default Tools
// ============================================================================

export const defaultTools: ToolDefinition[] = [
  {
    name: 'get_settings',
    description: 'Get the current user settings and persona',
    inputSchema: GetSettingsSchema,
    execute: async () => {
      const settings = await prisma.settings.findFirst({
        include: { activePersona: true },
      });
      if (!settings) {
        return { persona: null };
      }
      const persona = settings.activePersona;
      return {
        persona: {
          name: persona?.name || 'Tech Trends',
          handle: settings.xUsername ? `@${settings.xUsername}` : '@techtrends3107',
          tone: persona?.tone || 'professional',
          style: persona?.style || 'informative',
          topics: persona?.topics ? JSON.parse(persona.topics) : [],
          hashtagUsage: persona?.hashtagUsage ?? true,
          emojiUsage: persona?.emojiUsage ?? false,
        },
      };
    },
  },
  {
    name: 'draft_post',
    description: 'Draft a new post for X (Twitter)',
    inputSchema: DraftPostSchema,
    execute: async (input) => {
      const params = input as z.infer<typeof DraftPostSchema>;

      // Get persona for context
      const settings = await prisma.settings.findFirst({
        include: { activePersona: true },
      });
      const persona = settings?.activePersona;

      // Build prompt with persona context
      const tone = params.tone || persona?.tone || 'professional';
      const topics = persona?.topics ? JSON.parse(persona.topics).join(', ') : 'AI, Technology';
      const useHashtags = params.hashtags ?? (persona?.hashtagUsage ?? true);
      const useEmoji = persona?.emojiUsage ?? false;

      const prompt = `Write a ${tone} X (Twitter) post about: ${params.topic}

Context:
- Topics covered: ${topics}
- Style: ${persona?.style || 'informative'}
- Length: ${params.length || 'medium'}
- Include hashtags: ${useHashtags}
- Use emojis: ${useEmoji}

Keep it engaging and under 280 characters.`;

      // Use Claude to generate content
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : `🚀 ${params.topic}`;

      return {
        content,
        preview: true,
        personaUsed: {
          tone,
          style: persona?.style || 'informative',
          topics: persona?.topics || [],
        },
      };
    },
  },
  {
    name: 'save_draft',
    description: 'Save a draft to the database',
    inputSchema: SaveDraftSchema,
    execute: async (input) => {
      const params = input as z.infer<typeof SaveDraftSchema>;

      const draft = await prisma.draft.create({
        data: {
          content: params.content,
          metadata: JSON.stringify({
            title: params.title,
            createdAt: new Date().toISOString(),
          }),
          status: 'DRAFT',
        },
      });

      return {
        id: draft.id,
        saved: true,
      };
    },
  },
  {
    name: 'get_drafts',
    description: 'Get list of saved drafts',
    inputSchema: GetDraftsSchema,
    execute: async (input) => {
      const params = input as z.infer<typeof GetDraftsSchema>;
      const limit = params.limit || 10;

      const drafts = await prisma.draft.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return {
        drafts: drafts.map((d) => ({
          id: d.id,
          content: d.content,
          metadata: JSON.parse(d.metadata || '{}'),
          status: d.status,
          createdAt: d.createdAt.toISOString(),
        })),
        count: drafts.length,
      };
    },
  },
  {
    name: 'research_topic',
    description: 'Research a topic and return relevant information',
    inputSchema: ResearchTopicSchema,
    execute: async (input) => {
      const params = input as z.infer<typeof ResearchTopicSchema>;

      // Use Tavily API for web search (or fallback to Claude knowledge)
      // For now, use Claude's knowledge with current date context
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      });

      const prompt = `Research and provide current information about: ${params.topic}

Please provide:
1. Key trends and developments
2. Important statistics or facts
3. Notable opinions or perspectives
4. Suggested hashtags for this topic

Format as a concise summary suitable for social media content creation.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const summary = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : `Research on ${params.topic}`;

      return {
        topic: params.topic,
        summary,
        researchedAt: new Date().toISOString(),
      };
    },
  },
  {
    name: 'post_now',
    description: 'Post content to X (Twitter) immediately or schedule it',
    inputSchema: PostNowSchema,
    execute: async (input) => {
      const params = input as z.infer<typeof PostNowSchema>;

      // Get settings with X credentials
      const settings = await prisma.settings.findFirst();
      if (!settings?.xAccessToken) {
        throw new Error('X account not connected. Please connect your account in Settings.');
      }

      // Check if token needs refresh
      let accessToken = settings.xAccessToken;
      if (
        settings.xTokenExpiry &&
        new Date(settings.xTokenExpiry) < new Date(Date.now() + 5 * 60 * 1000)
      ) {
        // Refresh token
        const tokens = await refreshAccessToken(settings.xRefreshToken!);
        accessToken = tokens.accessToken;

        // Update in database
        await prisma.settings.update({
          where: { id: settings.id },
          data: {
            xAccessToken: tokens.accessToken,
            xRefreshToken: tokens.refreshToken,
            xTokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          },
        });
      }

      // If scheduling, save as draft with SCHEDULED status
      if (params.scheduledFor) {
        const scheduledDate = new Date(params.scheduledFor);
        if (scheduledDate <= new Date()) {
          throw new Error('Scheduled time must be in the future');
        }

        const draft = await prisma.draft.create({
          data: {
            content: params.content,
            scheduledAt: scheduledDate,
            status: 'SCHEDULED',
          },
        });

        return {
          scheduled: true,
          scheduledFor: params.scheduledFor,
          draftId: draft.id,
          message: 'Post scheduled successfully',
        };
      }

      // Post immediately to X
      try {
        const client = new TwitterApi(accessToken);
        const tweet = await client.v2.tweet(params.content);

        // Save to Post history
        await prisma.post.create({
          data: {
            tweetId: tweet.data.id,
            content: params.content,
            postedAt: new Date(),
          },
        });

        // Update daily post count (check today's posts)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const postsToday = await prisma.post.count({
          where: {
            postedAt: { gte: today },
          },
        });

        return {
          posted: true,
          tweetId: tweet.data.id,
          tweetUrl: `https://x.com/${settings.xUsername}/status/${tweet.data.id}`,
          postsToday,
          postsRemaining: Math.max(0, 17 - postsToday),
        };
      } catch (error: unknown) {
        // Check for rate limit errors
        if (error && typeof error === 'object' && 'code' in error && error.code === 429) {
          throw new Error('Rate limit exceeded. You can post 17 times per day on the free tier.');
        }
        throw error;
      }
    },
  },
];
