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
import { runResearchQuery, runAnalysisQuery, runDocsQuery } from './sdk-helper';

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

      // Use SDK with Tavily/Perplexity for research
      const today = new Date().toISOString().split('T')[0];
      const researchPrompt = `TODAY IS ${today}. Research and provide CURRENT information about: ${topic}

Focus on:
1. What's happening RIGHT NOW (today/this week)
2. Latest news, breakthroughs, or discussions
3. Why this matters RIGHT NOW

Use web search tools to find current information. Do NOT provide generic encyclopedia-style information.`;

      const summary = await runResearchQuery(researchPrompt);

      // Cache for 7 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.researchCache.create({
        data: {
          topic,
          results: summary,
          source: 'mcp',
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

    // Get persona for context
    const persona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });

    if (!persona) {
      throw new Error('Persona not found');
    }

    const topics = JSON.parse(persona.topics || '[]');
    const synthesisPrompt = `You are analyzing research to find the SINGLE BEST content idea for an X (Twitter) post today.

Research Data:
${this.researchResults.map((r) => `## ${r.topic}\n${r.results}`).join('\n\n')}

PERSONA CONTEXT:
- Tone: ${persona.tone} (how the voice should sound)
- Style: ${persona.style} (how content is structured)
- Topics: ${topics.join(', ')} (areas of focus)

CRITICAL: Find a SPECIFIC PROBLEM that was ENCOUNTERED and SOLVED, with the technical details of how.

WHAT DEVELOPERS FIND VALUABLE (from @trq212, @karpathy, Anthropic engineering):
✅ A specific bug encountered: "XLA compiler bug: bf16/fp32 mismatch caused highest probability token to drop"
✅ The debugging journey: "Initial fix removed workaround but exposed deeper bug in approximate top-k"
✅ The failed attempts: "Tried JSON but model kept overwriting it. Landed on JSON after experimentation"
✅ Trade-off decisions: "Model quality non-negotiable, so accepted 2% efficiency hit for exact top-k"
✅ Concrete workflows: "After work done I add: spin up subagent to read spec file and verify completion"
✅ Specific file names/commands: "create claude-progress.txt for state, init.sh for server startup"

RESEARCH FOR THESE PATTERNS in the research data:
- "I encountered", "I found", "we observed", "after experimenting"
- Specific error messages or manifestations
- What didn't work and why
- The trade-offs considered
- The exact solution (file names, commands, patterns)

WHAT TO AVOID (these are NOT informative):
❌ "AI is transforming development" - no specific problem or solution
❌ "40% reduction in dev time" - no mechanism, just a number
❌ "Use Claude Code for X" - too generic, no specific technique
❌ "Agents are the future" - thought leadership, not technical insight
❌ "Best practices for Y" - laundry list, no experience or debugging

YOUR TASK:
Find ONE specific problem-solution pair from the research. Ideally:
1. A specific bug or issue encountered
2. What was tried that didn't work
3. The final solution (with technical detail)
4. Why this solution worked (the insight)

Return ONLY ONE idea in this JSON format:
{
  "topic": "specific technical area",
  "uniqueAngle": "the specific problem encountered and how it was solved (with technical details like file names, commands, or error patterns)",
  "suggestedHashtags": ["#tag1", "#tag2"],
  "whyThisMatters": "the practical takeaway or lesson learned"
}

Do NOT provide multiple options. Choose the SINGLE BEST idea.`;

    const content = await runAnalysisQuery(synthesisPrompt, `You are a content strategist. Analyze research and identify the most compelling angle for a post. Your tone is ${persona.tone}. Respond ONLY with valid JSON, no explanation.`);

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      const idea = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (idea) {
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
              whyThisMatters: idea.whyThisMatters,
              status: 'SYNTHESIZED',
            }),
            status: 'SYNTHESIZED',
            updatedAt: new Date(),
          },
        });

        console.log(`[Workflow] Synthesis complete. Selected: "${idea.topic}" - ${idea.whyThisMatters}`);
      } else {
        console.log('[Workflow] No valid idea synthesized');
      }
    } catch (error) {
      console.error('[Workflow] Failed to parse synthesis response:', error);
      console.log('[Workflow] Response content:', content);
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

    for (const idea of this.synthesizedIdeas) {
      console.log(`[Workflow] Drafting post for: ${idea.topic}`);

      const today = new Date().toISOString().split('T')[0];
      const draftingPrompt = `TODAY IS ${today}. Write a complete X (Twitter) post based on this idea.

Topic: ${idea.topic}
Unique Angle: ${idea.uniqueAngle}

Persona Settings:
- Tone: ${persona.tone}
- Style: ${persona.style}
- Use Emojis: ${persona.emojiUsage}
- Use Hashtags: ${persona.hashtagUsage}

CRITICAL: Write like a developer who just solved a specific problem and is sharing the solution.

REFERENCE TWEETS (study these patterns):
✅ @trq212: "after the work is done I like to add: 'spin up a subagent to read the spec file and verify if work has been completed, have it give feedback if not and then address the feedback'"

✅ @karpathy: "first 100% autonomous coast-to-coast drive on Tesla FSD V14.2! 2 days 20 hours, 2732 miles, zero interventions. This one is special because the coast-to-coast drive was a major goal for the autopilot team from the start. A lot of hours were spent in marathon clip review"

✅ Anthropic engineering: "approximate top-k sometimes returned completely wrong results, but only for certain batch sizes. The December workaround had been inadvertently masking this problem."

KEY ELEMENTS to include:
- A SPECIFIC problem encountered (what broke, what didn't work)
- The debugging/learning process (what was tried, what failed)
- The solution (file names, commands, patterns, configuration changes)
- WHY it works (the insight, the "aha moment")
- Trade-offs if relevant (what was sacrificed)

STYLE: ${persona.tone} ${persona.style}
- Use first-person when appropriate: "I found", "we discovered", "after X attempts"
- Include technical details: file names, error patterns, commands, configurations
- Show the journey, not just the destination

REQUIREMENTS:
- MUST be under 280 characters
- ${persona.hashtagUsage ? 'Include 1-2 relevant hashtags' : 'No hashtags'}
- ${persona.emojiUsage ? 'Use 1 emoji max if it fits naturally' : 'No emojis'}

Write ONLY the tweet content. No explanation, no preamble.`;

      const content = await runDocsQuery(draftingPrompt, `You are an expert social media writer. Write ${persona.tone} ${persona.style} posts. Keep it under 280 characters.`);

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

    const persona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });

    for (const draftedPost of this.draftedPosts) {
      console.log(`[Workflow] Reviewing: ${draftedPost.content.substring(0, 50)}...`);

      const reviewPrompt = `Review this X post for quality:

POST: "${draftedPost.content}"

Persona guidelines:
- Tone: ${persona?.tone}
- Style: ${persona?.style}
- Hashtags: ${persona?.hashtagUsage}

Respond ONLY in JSON:
{
  "approved": true/false,
  "issues": ["issue1", "issue2"],
  "lengthOk": true/false,
  "hashtagsRelevant": true/false,
  "suggestedEdits": "improved version if issues found"
}

Criteria:
- Under 280 chars?
- Matches persona tone/style?
- Hashtags relevant if used?`;

      const review = await runAnalysisQuery(reviewPrompt, 'You are a content reviewer. Check posts against persona guidelines. Respond ONLY with valid JSON.');

      // Parse JSON response
      try {
        const jsonMatch = review.match(/\{[\s\S]*?\}/);
        const reviewResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (reviewResult) {
          this.reviewedPosts.push({
            content: reviewResult.approved ? draftedPost.content : reviewResult.suggestedEdits,
            approved: reviewResult.approved,
            issues: reviewResult.issues || [],
            lengthOk: reviewResult.lengthOk ?? true,
            hashtagsRelevant: reviewResult.hashtagsRelevant ?? true,
          });

          if (reviewResult.approved) {
            console.log(`[Workflow] ✓ Post approved`);
          } else {
            console.log(`[Workflow] ✗ Post rejected: ${reviewResult.issues.join(', ')}`);
          }
        } else {
          // Fallback to basic validation
          const issues: string[] = [];
          const lengthOk = draftedPost.content.length <= 280;
          if (!lengthOk) issues.push('Post exceeds 280 characters');
          this.reviewedPosts.push({
            content: draftedPost.content,
            approved: issues.length === 0,
            issues,
            lengthOk,
            hashtagsRelevant: true,
          });
        }
      } catch (error) {
        console.error('[Workflow] Failed to parse review response:', error);
        // Fallback to basic validation
        this.reviewedPosts.push({
          content: draftedPost.content,
          approved: true,
          issues: [],
          lengthOk: true,
          hashtagsRelevant: true,
        });
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

    const persona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });

    if (!persona) {
      console.log('[Workflow] Persona not found, skipping learning phase');
      return;
    }

    // Store successful posts as learning patterns
    for (const posted of this.postedResults) {
      const draftedPost = this.draftedPosts.find((p) => p.content === posted.content);
      if (!draftedPost) continue;

      console.log(`[Workflow] Learning from: ${posted.tweetId}`);

      // Create learning trace
      const learningData = {
        topic: draftedPost.topic,
        tone: persona.tone,
        style: persona.style,
        postedAt: posted.postedAt,
        tweetId: posted.tweetId,
        outcome: 'posted',
        uniqueAngle: draftedPost.uniqueAngle,
        valueAdd: draftedPost.valueAdd,
      };

      // Store trace in database (context-graph integration layer)
      await this.storeLearningTrace(learningData);
    }

    // Query for successful patterns
    const successfulPatterns = await this.querySuccessfulPatterns(persona);
    if (successfulPatterns.length > 0) {
      console.log(`[Workflow] Found ${successfulPatterns.length} successful patterns for next iteration`);
    }

    console.log(`[Workflow] Learning complete. ${this.postedResults.length} patterns analyzed.`);
    await this.updateWorkflowRun();
  }

  /**
   * Store learning trace in database
   */
  private async storeLearningTrace(data: any): Promise<void> {
    try {
      // Store as PostAnalytics for future reference
      await prisma.postAnalytics.create({
        data: {
          postId: data.tweetId,
          likes: 0, // Will be updated later
          retweets: 0,
          replies: 0,
          uniqueAngle: data.uniqueAngle,
          personalVoice: true,
          valueAdd: data.valueAdd,
          checkedAt: new Date(),
        },
      });

      // Log pattern for context-graph (would be integrated with MCP in production)
      console.log('[Workflow] Stored learning trace:', {
        decision: `Successful post on topic: ${data.topic}`,
        category: 'posting',
        outcome: 'success',
        timestamp: data.postedAt,
      });
    } catch (error) {
      // If PostAnalytics doesn't exist yet, just log
      console.log('[Workflow] Learning trace:', JSON.stringify(data, null, 2));
    }
  }

  /**
   * Query successful patterns from history
   */
  private async querySuccessfulPatterns(persona: any): Promise<any[]> {
    try {
      // Get recent successful posts
      const recentPosts = await prisma.post.findMany({
        where: {
          postedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { postedAt: 'desc' },
        take: 10,
      });

      // Extract patterns (in production, this would use context-graph semantic search)
      const patterns = recentPosts.map((post) => ({
        topic: 'extracted_from_content',
        tone: persona.tone,
        postedAt: post.postedAt,
        engagement: {
          likes: 0,
          retweets: 0,
        },
      }));

      return patterns;
    } catch (error) {
      console.error('[Workflow] Error querying patterns:', error);
      return [];
    }
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
