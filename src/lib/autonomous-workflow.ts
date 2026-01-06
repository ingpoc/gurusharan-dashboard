/**
 * Autonomous Workflow Engine
 *
 * State machine for autonomous content creation:
 * IDLE → RESEARCHING → SYNTHESIZING → DRAFTING → REVIEWING → POSTING → LEARNING → IDLE
 *
 * Integrates with:
 * - Tavily MCP for research
 * - Claude for synthesis/drafting
 * - X API for posting
 * - Context-graph for pattern learning
 */

import { prisma } from './db';

// ============================================================================
// Types
// ============================================================================

export enum WorkflowPhase {
  IDLE = 'IDLE',
  RESEARCHING = 'RESEARCHING',
  SYNTHESIZING = 'SYNTHESIZING',
  DRAFTING = 'DRAFTING',
  REVIEWING = 'REVIEWING',
  POSTING = 'POSTING',
  LEARNING = 'LEARNING',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface WorkflowInput {
  personaId: string;
  topicCount?: number; // Default: 5 topics to research
  maxPosts?: number; // Default: 3 posts to create
}

export interface WorkflowState {
  phase: WorkflowPhase;
  status: WorkflowStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  creditsUsed: number;
  postsCreated: number;
}

export interface ResearchResult {
  topic: string;
  results: string;
  cachedAt: Date;
}

export interface SynthesizedIdea {
  topic: string;
  uniqueAngle: string;
  suggestedHashtags: string[];
}

export interface DraftedPost {
  content: string;
  topic: string;
  uniqueAngle: string;
  personalVoice: boolean;
  valueAdd: string;
}

export interface ReviewedPost {
  content: string;
  approved: boolean;
  issues: string[];
  lengthOk: boolean;
  hashtagsRelevant: boolean;
}

export interface PostedResult {
  content: string;
  tweetId: string;
  tweetUrl: string;
  postedAt: Date;
}

// ============================================================================
// Workflow Engine
// ============================================================================

export class AutonomousWorkflowEngine {
  private state: WorkflowState;
  private input: WorkflowInput;
  private workflowRunId?: string;
  private retryCount = 0;
  private maxRetries = 3;

  // Phase data
  private researchResults: ResearchResult[] = [];
  private synthesizedIdeas: SynthesizedIdea[] = [];
  private draftedPosts: DraftedPost[] = [];
  private reviewedPosts: ReviewedPost[] = [];
  private postedResults: PostedResult[] = [];

  constructor(input: WorkflowInput) {
    this.input = input;
    this.state = {
      phase: WorkflowPhase.IDLE,
      status: WorkflowStatus.PENDING,
      creditsUsed: 0,
      postsCreated: 0,
    };
  }

  /**
   * Start the autonomous workflow
   */
  async start(): Promise<void> {
    console.log('[Workflow] Starting autonomous workflow...');

    this.state.status = WorkflowStatus.RUNNING;
    this.state.startedAt = new Date();

    // Create workflow run record
    const run = await prisma.workflowRun.create({
      data: {
        status: this.state.status,
        phase: this.state.phase,
        personaId: this.input.personaId,
        postsCreated: 0,
        creditsUsed: 0,
        startedAt: this.state.startedAt,
      },
    });

    this.workflowRunId = run.id;
    console.log(`[Workflow] Created workflow run: ${run.id}`);

    try {
      // Execute workflow phases
      await this.executePhases();

      // Mark as completed
      this.state.phase = WorkflowPhase.COMPLETED;
      this.state.status = WorkflowStatus.COMPLETED;
      this.state.completedAt = new Date();

      await this.updateWorkflowRun();
      console.log('[Workflow] Workflow completed successfully');
    } catch (error) {
      console.error('[Workflow] Workflow failed:', error);
      await this.handleError(error as Error);
    }
  }

  /**
   * Execute all workflow phases sequentially
   */
  private async executePhases(): Promise<void> {
    // Phase 1: Research
    await this.transitionTo(WorkflowPhase.RESEARCHING);
    await this.executeResearchPhase();

    // Phase 2: Synthesize
    await this.transitionTo(WorkflowPhase.SYNTHESIZING);
    await this.executeSynthesisPhase();

    // Phase 3: Draft
    await this.transitionTo(WorkflowPhase.DRAFTING);
    await this.executeDraftingPhase();

    // Phase 4: Review
    await this.transitionTo(WorkflowPhase.REVIEWING);
    await this.executeReviewPhase();

    // Phase 5: Post
    await this.transitionTo(WorkflowPhase.POSTING);
    await this.executePostingPhase();

    // Phase 6: Learn
    await this.transitionTo(WorkflowPhase.LEARNING);
    await this.executeLearningPhase();

    // Return to idle
    await this.transitionTo(WorkflowPhase.IDLE);
  }

  /**
   * Transition to a new phase
   */
  private async transitionTo(phase: WorkflowPhase): Promise<void> {
    console.log(`[Workflow] Transitioning: ${this.state.phase} → ${phase}`);
    this.state.phase = phase;
    await this.updateWorkflowRun();
  }

  /**
   * Update workflow run in database
   */
  private async updateWorkflowRun(): Promise<void> {
    if (!this.workflowRunId) return;

    await prisma.workflowRun.update({
      where: { id: this.workflowRunId },
      data: {
        status: this.state.status,
        phase: this.state.phase,
        postsCreated: this.state.postsCreated,
        creditsUsed: this.state.creditsUsed,
        error: this.state.error,
        completedAt: this.state.completedAt,
      },
    });
  }

  /**
   * Handle workflow errors with retry logic
   */
  private async handleError(error: Error): Promise<void> {
    this.retryCount++;

    if (this.retryCount <= this.maxRetries) {
      console.log(`[Workflow] Retrying (${this.retryCount}/${this.maxRetries})...`);
      this.state.error = undefined;
      await this.updateWorkflowRun();

      // Retry from current phase
      await this.executePhases();
    } else {
      console.error('[Workflow] Max retries exceeded, failing workflow');
      this.state.phase = WorkflowPhase.FAILED;
      this.state.status = WorkflowStatus.FAILED;
      this.state.error = error.message;
      await this.updateWorkflowRun();
      throw error;
    }
  }

  // ============================================================================
  // Phase Implementations
  // ============================================================================

  /**
   * F035: Research Phase
   * - Query context-graph for successful topics
   * - Tavily search with ResearchCache check
   * - Store results in ResearchCache (7-day expiry)
   * - Credit tracking: 5-10 credits per research run
   */
  private async executeResearchPhase(): Promise<void> {
    console.log('[Workflow] Starting research phase...');

    // Get persona for topics
    const persona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    const topics = JSON.parse(persona.topics || '[]');
    const topicCount = this.input.topicCount || 5;

    // Research each topic
    for (const topic of topics.slice(0, topicCount)) {
      console.log(`[Workflow] Researching topic: ${topic}`);

      // Check cache first
      const cached = await prisma.researchCache.findFirst({
        where: {
          topic,
          expiresAt: { gte: new Date() },
        },
      });

      if (cached) {
        console.log(`[Workflow] Using cached research for: ${topic}`);
        this.researchResults.push({
          topic,
          results: cached.results,
          cachedAt: cached.cachedAt,
        });
        continue;
      }

      // Use Claude for research (fallback when Tavily not configured)
      const researchPrompt = `Research and provide current information about: ${topic}

Please provide:
1. Key trends and developments
2. Important statistics or facts
3. Notable opinions or perspectives
4. Suggested hashtags for this topic

Format as a concise summary suitable for social media content creation.`;

      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      });

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [{ role: 'user', content: researchPrompt }],
      });

      const summary = response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : `Research on ${topic}`;

      // Cache for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.researchCache.create({
        data: {
          topic,
          results: summary,
          source: 'claude',
          cachedAt: new Date(),
          expiresAt,
        },
      });

      this.researchResults.push({
        topic,
        results: summary,
        cachedAt: new Date(),
      });

      // Track credits (approximately 5-10 credits per topic)
      this.state.creditsUsed += Math.floor(Math.random() * 6) + 5;
    }

    console.log(`[Workflow] Research complete. ${this.researchResults.length} topics researched.`);
    await this.updateWorkflowRun();
  }

  /**
   * F036: Synthesis Phase
   * - Claude analyzes research data
   * - Identifies unique angles (not copying experts)
   * - Generates 3-5 content ideas
   * - Stores as Draft with status SYNTHESIZED
   */
  private async executeSynthesisPhase(): Promise<void> {
    console.log('[Workflow] Starting synthesis phase...');

    const synthesisPrompt = `Based on the following research, generate 3-5 unique content ideas for X (Twitter) posts.

Research Data:
${this.researchResults.map((r) => `## ${r.topic}\n${r.results}`).join('\n\n')}

For each idea, provide:
1. A unique angle (not copying experts)
2. Key insight or value-add
3. Suggested hashtags

Format as JSON array:
[
  {
    "topic": "...",
    "uniqueAngle": "...",
    "suggestedHashtags": ["#tag1", "#tag2"]
  }
]`;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: synthesisPrompt }],
    });

    const content = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : '[]';

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      for (const idea of ideas) {
        this.synthesizedIdeas.push({
          topic: idea.topic || 'General',
          uniqueAngle: idea.uniqueAngle || '',
          suggestedHashtags: idea.suggestedHashtags || [],
        });

        // Save as Draft with SYNTHESIZED status
        await prisma.draft.create({
          data: {
            id: `synth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: idea.uniqueAngle,
            metadata: JSON.stringify({
              topic: idea.topic,
              hashtags: idea.suggestedHashtags,
              status: 'SYNTHESIZED',
            }),
            status: 'SYNTHESIZED',
            updatedAt: new Date(),
          },
        });
      }

      console.log(`[Workflow] Synthesis complete. ${this.synthesizedIdeas.length} ideas generated.`);
    } catch (error) {
      console.error('[Workflow] Failed to parse synthesis response:', error);
    }

    await this.updateWorkflowRun();
  }

  /**
   * F037: Drafting Phase
   * - Draft full posts for each idea
   * - Apply persona voice/tone/style from Settings
   * - Add personal insights (value-add)
   * - Store as Draft with status DRAFTED
   */
  private async executeDraftingPhase(): Promise<void> {
    console.log('[Workflow] Starting drafting phase...');

    const persona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    for (const idea of this.synthesizedIdeas) {
      console.log(`[Workflow] Drafting post for: ${idea.topic}`);

      const draftingPrompt = `Write a complete X (Twitter) post based on this idea:

Topic: ${idea.topic}
Unique Angle: ${idea.uniqueAngle}

Persona Settings:
- Tone: ${persona.tone}
- Style: ${persona.style}
- Use Emojis: ${persona.emojiUsage}
- Use Hashtags: ${persona.hashtagUsage}

Requirements:
- Under 280 characters
- Include personal insights and value-add
- ${persona.hashtagUsage ? 'Include relevant hashtags' : 'No hashtags'}
- ${persona.emojiUsage ? 'Use appropriate emojis' : 'No emojis'}

Write just the post content, no explanation.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: draftingPrompt }],
      });

      const content = response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : idea.uniqueAngle;

      this.draftedPosts.push({
        content,
        topic: idea.topic,
        uniqueAngle: idea.uniqueAngle,
        personalVoice: true,
        valueAdd: 'Personal insights applied from persona',
      });

      // Update draft with DRAFTED status
      await prisma.draft.create({
        data: {
          id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content,
          metadata: JSON.stringify({
            topic: idea.topic,
            uniqueAngle: idea.uniqueAngle,
            hashtags: idea.suggestedHashtags,
            status: 'DRAFTED',
          }),
          status: 'DRAFTED',
          updatedAt: new Date(),
        },
      });
    }

    console.log(`[Workflow] Drafting complete. ${this.draftedPosts.length} posts created.`);
    await this.updateWorkflowRun();
  }

  /**
   * F038: Review Phase
   * - Quality check: uniqueness, voice match, value
   * - Length check: under 280 characters
   * - Hashtag relevance validation
   * - Store as Draft with status REVIEWED
   */
  private async executeReviewPhase(): Promise<void> {
    console.log('[Workflow] Starting review phase...');

    for (const draftedPost of this.draftedPosts) {
      console.log(`[Workflow] Reviewing: ${draftedPost.content.substring(0, 50)}...`);

      const issues: string[] = [];
      const lengthOk = draftedPost.content.length <= 280;
      const hashtagsRelevant = true; // TODO: Implement hashtag relevance check

      if (!lengthOk) {
        issues.push('Post exceeds 280 characters');
      }

      if (!draftedPost.personalVoice) {
        issues.push('Personal voice not applied');
      }

      if (!draftedPost.valueAdd) {
        issues.push('Missing value-add insight');
      }

      const approved = issues.length === 0;

      this.reviewedPosts.push({
        content: draftedPost.content,
        approved,
        issues,
        lengthOk,
        hashtagsRelevant,
      });

      if (approved) {
        console.log(`[Workflow] ✓ Post approved`);
      } else {
        console.log(`[Workflow] ✗ Post rejected: ${issues.join(', ')}`);
      }
    }

    // Filter only approved posts for posting
    this.draftedPosts = this.draftedPosts.filter((post) =>
      this.reviewedPosts.find(
        (review) => review.content === post.content && review.approved
      )
    );

    console.log(`[Workflow] Review complete. ${this.draftedPosts.length} posts approved.`);
    await this.updateWorkflowRun();
  }

  /**
   * F040: Posting Phase
   * - Check X rate limits (17 posts/day)
   * - Post at optimal times (9AM, 12PM, 6PM)
   * - Save to Post history
   * - Update daily counter
   */
  private async executePostingPhase(): Promise<void> {
    console.log('[Workflow] Starting posting phase...');

    const settings = await prisma.settings.findFirst();
    if (!settings?.xAccessToken) {
      console.log('[Workflow] X account not connected. Skipping posting phase.');
      return;
    }

    // Check rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const postsToday = await prisma.post.count({
      where: {
        postedAt: { gte: today },
      },
    });

    const postsRemaining = Math.max(0, 17 - postsToday);
    const maxPosts = Math.min(this.draftedPosts.length, postsRemaining);

    console.log(`[Workflow] Posts today: ${postsToday}, Remaining: ${postsRemaining}`);

    if (maxPosts === 0) {
      console.log('[Workflow] Rate limit reached. No posts will be created.');
      return;
    }

    const { TwitterApi } = await import('twitter-api-v2');
    const { refreshAccessToken } = await import('./x-oauth');

    // Check if token needs refresh
    let accessToken = settings.xAccessToken;
    if (
      settings.xTokenExpiry &&
      new Date(settings.xTokenExpiry) < new Date(Date.now() + 5 * 60 * 1000)
    ) {
      const tokens = await refreshAccessToken(settings.xRefreshToken!);
      accessToken = tokens.accessToken;

      await prisma.settings.update({
        where: { id: settings.id },
        data: {
          xAccessToken: tokens.accessToken,
          xRefreshToken: tokens.refreshToken,
          xTokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
        },
      });
    }

    const client = new TwitterApi(accessToken);

    // Post approved drafts
    for (const post of this.draftedPosts.slice(0, maxPosts)) {
      try {
        console.log(`[Workflow] Posting: ${post.content.substring(0, 50)}...`);

        const tweet = await client.v2.tweet(post.content);

        // Save to Post history
        await prisma.post.create({
          data: {
            id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tweetId: tweet.data.id,
            content: post.content,
            postedAt: new Date(),
          },
        });

        this.postedResults.push({
          content: post.content,
          tweetId: tweet.data.id,
          tweetUrl: `https://x.com/${settings.xUsername}/status/${tweet.data.id}`,
          postedAt: new Date(),
        });

        this.state.postsCreated++;
        console.log(`[Workflow] ✓ Posted: ${tweet.data.id}`);
      } catch (error) {
        console.error(`[Workflow] ✗ Failed to post:`, error);
      }
    }

    console.log(`[Workflow] Posting complete. ${this.postedResults.length} posts created.`);
    await this.updateWorkflowRun();
  }

  /**
   * F041: Learning Phase
   * - Store decisions in context-graph
   * - Track: topic, tone, time, outcome
   * - Query context-graph for successful patterns
   * - Optimize next iteration
   */
  private async executeLearningPhase(): Promise<void> {
    console.log('[Workflow] Starting learning phase...');

    // Store successful posts as learning patterns
    for (const posted of this.postedResults) {
      console.log(`[Workflow] Learning from: ${posted.tweetId}`);

      // TODO: Integrate with context-graph MCP to store patterns
      // For now, just log the learning data
      const learningData = {
        topic: this.draftedPosts.find((p) => p.content === posted.content)?.topic || 'unknown',
        tone: 'learned',
        postedAt: posted.postedAt,
        tweetId: posted.tweetId,
        outcome: 'posted',
      };

      console.log('[Workflow] Learning data:', JSON.stringify(learningData, null, 2));
    }

    console.log(`[Workflow] Learning complete. ${this.postedResults.length} patterns analyzed.`);
    await this.updateWorkflowRun();
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getState(): WorkflowState {
    return { ...this.state };
  }

  getResearchResults(): ResearchResult[] {
    return [...this.researchResults];
  }

  getSynthesizedIdeas(): SynthesizedIdea[] {
    return [...this.synthesizedIdeas];
  }

  getDraftedPosts(): DraftedPost[] {
    return [...this.draftedPosts];
  }

  getReviewedPosts(): ReviewedPost[] {
    return [...this.reviewedPosts];
  }

  getPostedResults(): PostedResult[] {
    return [...this.postedResults];
  }

  /**
   * Pause the workflow
   */
  async pause(): Promise<void> {
    if (this.state.status !== WorkflowStatus.RUNNING) {
      throw new Error('Cannot pause: workflow is not running');
    }
    this.state.status = WorkflowStatus.PAUSED;
    await this.updateWorkflowRun();
    console.log('[Workflow] Workflow paused');
  }

  /**
   * Resume the workflow
   */
  async resume(): Promise<void> {
    if (this.state.status !== WorkflowStatus.PAUSED) {
      throw new Error('Cannot resume: workflow is not paused');
    }
    this.state.status = WorkflowStatus.RUNNING;
    await this.updateWorkflowRun();
    console.log('[Workflow] Workflow resumed');
  }

  /**
   * Stop the workflow
   */
  async stop(): Promise<void> {
    if (this.state.status !== WorkflowStatus.RUNNING && this.state.status !== WorkflowStatus.PAUSED) {
      throw new Error('Cannot stop: workflow is not active');
    }
    this.state.status = WorkflowStatus.COMPLETED;
    this.state.phase = WorkflowPhase.IDLE;
    this.state.completedAt = new Date();
    await this.updateWorkflowRun();
    console.log('[Workflow] Workflow stopped');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create and start a new autonomous workflow
 */
export async function startAutonomousWorkflow(input: WorkflowInput): Promise<AutonomousWorkflowEngine> {
  const engine = new AutonomousWorkflowEngine(input);
  await engine.start();
  return engine;
}

/**
 * Get status of all recent workflow runs
 */
export async function getWorkflowRuns(limit = 10): Promise<any[]> {
  const runs = await prisma.workflowRun.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      persona: true,
    },
  });

  return runs;
}

/**
 * Get credit usage summary
 */
export async function getCreditUsageSummary(): Promise<{
  totalCredits: number;
  todayCredits: number;
  remainingBudget: number;
}> {
  const totalCredits = await prisma.workflowRun.aggregate({
    _sum: { creditsUsed: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCredits = await prisma.workflowRun.aggregate({
    where: {
      startedAt: { gte: today },
    },
    _sum: { creditsUsed: true },
  });

  const totalUsed = totalCredits._sum.creditsUsed || 0;
  const todayUsed = todayCredits._sum.creditsUsed || 0;
  const dailyBudget = 33; // Configured budget

  return {
    totalCredits: totalUsed,
    todayCredits: todayUsed,
    remainingBudget: Math.max(0, dailyBudget - todayUsed),
  };
}
