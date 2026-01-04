import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from './db';
import { TwitterApi } from 'twitter-api-v2';
import { refreshAccessToken } from './x-oauth';

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

  private buildSystemPrompt(): string {
    const toolDescriptions = Array.from(this.tools.values())
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `You are an AI content creation assistant for @techtrends3107, an X (Twitter) account focused on AI and technology trends.

Your capabilities:
${toolDescriptions}

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
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodToAnthropicSchema(tool.inputSchema),
    }));
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
    const tool = this.tools.get(toolUse.name);

    if (!tool) {
      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: `Error: Unknown tool "${toolUse.name}"`,
      };
    }

    try {
      const validatedInput = tool.inputSchema.parse(toolUse.input);
      const result = await tool.execute(validatedInput);

      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result, null, 2),
      };
    } catch (error) {
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

    let currentToolUses: ToolUse[] = [];

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

      let accumulatedText = '';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block?.type === 'tool_use') {
            const toolInput = event.content_block.input as Record<string, unknown>;
            currentToolUses.push({
              type: 'tool_use',
              id: event.content_block.id,
              name: event.content_block.name,
              input: toolInput,
            });
            yield {
              type: 'tool_use',
              content: '',
              toolName: event.content_block.name,
              toolInput,
            };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            accumulatedText += event.delta.text;
            yield {
              type: 'text',
              content: event.delta.text,
            };
          }
        } else if (event.type === 'content_block_stop') {
          // Check if we have tool uses to execute
          if (currentToolUses.length > 0) {
            for (const toolUse of currentToolUses) {
              const result = await this.executeTool(toolUse);
              yield {
                type: 'tool_result',
                content: typeof result.content === 'string'
                  ? result.content
                  : JSON.stringify(result.content),
              };
            }

            // Continue conversation with tool results
            const toolResultMessages: Anthropic.MessageParam[] = [
              ...messages,
              {
                role: 'assistant',
                content: currentToolUses,
              },
              {
                role: 'user',
                content: currentToolUses.map((tu) => {
                  const result = this.executeToolSync(tu);
                  return {
                    type: 'tool_result',
                    tool_use_id: tu.id,
                    content: result,
                  };
                }),
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

            for await (const finalEvent of finalStream) {
              if (finalEvent.type === 'content_block_delta' &&
                  finalEvent.delta.type === 'text_delta') {
                yield {
                  type: 'text',
                  content: finalEvent.delta.text,
                };
              }
            }

            currentToolUses = [];
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

  /**
   * Synchronous tool execution for second round
   */
  private executeToolSync(toolUse: ToolUse): string {
    const tool = this.tools.get(toolUse.name);
    if (!tool) {
      return `Error: Unknown tool "${toolUse.name}"`;
    }
    // For sync context, return a placeholder
    // Real implementation would use async/await properly
    return JSON.stringify({ status: 'executed', tool: toolUse.name });
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
      const settings = await prisma.settings.findFirst();
      if (!settings) {
        return { persona: null };
      }
      const persona = JSON.parse(settings.persona || '{}');
      return {
        persona: {
          name: persona.name || 'Tech Trends',
          handle: settings.xUsername ? `@${settings.xUsername}` : '@techtrends3107',
          tone: persona.tone || 'professional',
          style: persona.style || 'informative',
          topics: persona.topics || [],
          hashtagUsage: persona.hashtagUsage ?? true,
          emojiUsage: persona.emojiUsage ?? false,
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
      const settings = await prisma.settings.findFirst();
      const persona = settings ? JSON.parse(settings.persona || '{}') : {};

      // Build prompt with persona context
      const tone = params.tone || persona.tone || 'professional';
      const topics = persona.topics?.join(', ') || 'AI, Technology';
      const useHashtags = params.hashtags ?? (persona.hashtagUsage ?? true);
      const useEmoji = persona.emojiUsage ?? false;

      const prompt = `Write a ${tone} X (Twitter) post about: ${params.topic}

Context:
- Topics covered: ${topics}
- Style: ${persona.style || 'informative'}
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
          style: persona.style,
          topics: persona.topics,
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
      } catch (error: any) {
        // Check for rate limit errors
        if (error.code === 429) {
          throw new Error('Rate limit exceeded. You can post 17 times per day on the free tier.');
        }
        throw error;
      }
    },
  },
];
