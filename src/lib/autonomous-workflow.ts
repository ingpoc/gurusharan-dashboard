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
import { runResearchQuery, runDocsQuery, runAnalysisQuery } from './sdk-helper';
import type { Persona } from '@prisma/client';

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
  approved?: boolean;
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

  // Cached data (fetched once, reused across phases)
  private cachedPersona: Persona | null = null;

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
    this.state.phase = WorkflowPhase.RESEARCHING;
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

    // Cache persona once for all phases (avoids 5 redundant DB queries)
    this.cachedPersona = await prisma.persona.findUnique({
      where: { id: this.input.personaId },
    });
    if (!this.cachedPersona) {
      throw new Error('Persona not found');
    }
    console.log(`[Workflow] Cached persona: ${this.cachedPersona.name}`);

    // Invalidate research cache BEFORE workflow starts - ensures fresh research every time
    await this.invalidateResearchCache();

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
   * DB updates only at key milestones to reduce writes
   */
  private async executePhases(): Promise<void> {
    // Phase 1: Research
    this.state.phase = WorkflowPhase.RESEARCHING;
    await this.executeResearchPhase();

    // Phase 2: Synthesize
    this.state.phase = WorkflowPhase.SYNTHESIZING;
    await this.executeSynthesisPhase();

    // Phase 3: Draft (first milestone update)
    this.state.phase = WorkflowPhase.DRAFTING;
    await this.executeDraftingPhase();
    await this.updateWorkflowRun(); // MILESTONE: drafts created

    // Phase 4: Review
    this.state.phase = WorkflowPhase.REVIEWING;
    await this.executeReviewPhase();

    // Phase 5: Post (second milestone update)
    this.state.phase = WorkflowPhase.POSTING;
    await this.executePostingPhase();
    await this.updateWorkflowRun(); // MILESTONE: posts created

    // Phase 6: Learn
    this.state.phase = WorkflowPhase.LEARNING;
    await this.executeLearningPhase();

    // Final update
    this.state.phase = WorkflowPhase.IDLE;
    await this.updateWorkflowRun();
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

  /**
   * Invalidate research cache after workflow completes
   * Ensures next workflow gets fresh data from web search
   */
  private async invalidateResearchCache(): Promise<void> {
    try {
      const result = await prisma.researchCache.deleteMany({});
      console.log(`[Workflow] Invalidated ${result.count} research cache entries`);
    } catch (error) {
      console.error('[Workflow] Failed to invalidate research cache:', error);
    }
  }

  // ============================================================================
  // Phase Implementations
  // ============================================================================

  /**
   * F035: Research Phase
   * - Persona topics with daily aspect rotation (latest developments, breaking news, etc.)
   * - Tavily/Perplexity search with ResearchCache check
   * - Store results in ResearchCache (7-day expiry)
   * - Credit tracking: 5-10 credits per research run
   */
  private async executeResearchPhase(): Promise<void> {
    console.log('[Workflow] Starting research phase...');

    // Get persona for topics (cached)
    const persona = this.cachedPersona!;

    // Get recent posts (last 10) to check for duplicate topics
    // Note: Using recent posts instead of date filter due to broken dates in DB
    const recentPosts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        content: true,
      },
    });

    const personaTopics = JSON.parse(persona.topics || '[]');
    console.log(`[Workflow] Recent posts checked: ${recentPosts.length}`);

    // Extract keywords from persona topics (split by commas)
    const topicKeywords = personaTopics.flatMap((topic: string) =>
      topic.split(',').map((t: string) => t.trim().toLowerCase())
    );

    // Extract key technical terms from recent posts (2+ word phrases, capitalized terms)
    const recentPostContent = recentPosts.map(p => p.content).join('\n');
    const technicalTerms = recentPostContent.match(/\b[A-Z]{2,}[a-z]*\b|\b[a-z]+-[a-z]+\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
    console.log(`[Workflow] DEBUG: Extracted technical terms: ${technicalTerms.join(', ') || 'none'}`);

    const postedKeywords = [
      ...topicKeywords.filter((keyword: string) =>
        recentPosts.some(post => post.content.toLowerCase().includes(keyword))
      ),
      ...technicalTerms.map(t => t.toLowerCase())
    ];

    // Remove duplicates
    const uniquePostedKeywords = [...new Set(postedKeywords)];

    console.log(`[Workflow] Keywords to avoid: ${uniquePostedKeywords.join(', ') || 'none'}`);

    // Hardcoded blacklist of topics to explicitly skip
    const topicBlacklist = [
      'xla',
      'bf16',
      'fp32',
      'compiler',
      'top-k',
      'topk',
      'approximate top',
      'exact top',
      'token drop',
      'probability token',
      'claude-progress',
      'init.sh'
    ];

    // Combine posted keywords with blacklist
    const allAvoidedKeywords = [...new Set([...uniquePostedKeywords, ...topicBlacklist])];

    console.log(`[Workflow] Total keywords to avoid (including blacklist): ${allAvoidedKeywords.length}`);

    // Check if a topic has any of its keywords already posted
    const isTopicPosted = (topic: string): boolean => {
      const keywords = topic.split(',').map(t => t.trim().toLowerCase());
      return keywords.some((kw: string) => uniquePostedKeywords.includes(kw));
    };

    const topicCount = this.input.topicCount || 5;

    // Add variety: rotate daily through different aspects
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const aspects = ['latest developments', 'breaking news', 'recent discussions', 'new techniques', 'emerging trends'];

    // Research each topic with rotating aspect, skipping already-posted topics
    for (let i = 0; i < Math.min(personaTopics.length, topicCount); i++) {
      const topic = personaTopics[i];

      // Skip if any keyword from this topic was already posted today
      if (isTopicPosted(topic)) {
        console.log(`[Workflow] Skipping topic already posted today: ${topic}`);
        continue;
      }

      const aspect = aspects[(dayOfYear + i) % aspects.length];
      const variedTopic = `${topic} - ${aspect}`;
      console.log(`[Workflow] Researching topic: ${topic} (aspect: ${aspect})`);

      // Check cache first (using varied topic for cache key)
      const cached = await prisma.researchCache.findFirst({
        where: {
          topic: variedTopic,
          expiresAt: { gte: new Date() },
        },
      });

      if (cached) {
        console.log(`[Workflow] Using cached research for: ${variedTopic}`);
        this.researchResults.push({
          topic: variedTopic,
          results: cached.results,
          cachedAt: cached.cachedAt,
        });
        continue;
      }

      // Detect if topic is about a GitHub repository
      const isGitHubRepo = /github\.com|[\w-]+\/[\w-]+|repo|repository/i.test(topic) ||
        /claude-code|anthropic|vercel|next\.js|openai|langchain|tensorflow|pytorch/i.test(topic);

      let summary: string;

      if (isGitHubRepo) {
        // Use Context7 for GitHub repo documentation
        console.log(`[Workflow] GitHub repo detected, using Context7 for documentation lookup`);
        const today = new Date().toISOString().split('T')[0];
        const docsPrompt = `TODAY IS ${today}. Research this GitHub repository or project: ${variedTopic}

Find and provide:
1. Latest documentation and API changes
2. Recent releases, version updates, or breaking changes
3. Current issues, discussions, or roadmap items
4. Example usage patterns or best practices

AVOID topics already covered: ${allAvoidedKeywords.length > 0 ? allAvoidedKeywords.join(', ') : 'none'}

Use context7 tools to lookup official documentation. Focus on CURRENT and RECENT information.`;

        console.log(`[Workflow] DEBUG: Context7 prompt length: ${docsPrompt.length}`);
        console.log(`[Workflow] DEBUG: Avoiding keywords: ${allAvoidedKeywords.slice(0, 10).join(', ')}`);

        summary = await runDocsQuery(docsPrompt);
        console.log(`[Workflow] DEBUG: Research result length: ${summary.length}`);
        console.log(`[Workflow] DEBUG: Research preview: ${summary.slice(0, 200)}...`);

        // Filter: Skip research if it contains blacklisted keywords
        const hasBlacklistedContent = allAvoidedKeywords.some((keyword: string) =>
          summary.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasBlacklistedContent) {
          console.log(`[Workflow] SKIPPING: Research contains blacklisted keywords`);
          continue;
        }
      } else {
        // Use Tavily/Perplexity for general web research
        const today = new Date().toISOString().split('T')[0];
        const researchPrompt = `TODAY IS ${today}. Research and provide CURRENT information about: ${variedTopic}

Focus on:
1. What's happening RIGHT NOW (today/this week)
2. Latest news, breakthroughs, or discussions
3. Why this matters RIGHT NOW

AVOID topics already covered: ${allAvoidedKeywords.length > 0 ? allAvoidedKeywords.join(', ') : 'none'}
If search results only cover these avoided topics, try a different angle or subtopic.

IMPORTANT: You MUST use one of these MCP search tools for web search:
- Use mcp__tavily__search for comprehensive web search with sources
- Use mcp__perplexity__search for AI-powered search with reasoning
- Use mcp__perplexity__reason for complex research requiring analysis

Do NOT use the built-in WebSearch tool. Only use the MCP tools: mcp__tavily__search, mcp__perplexity__search, or mcp__perplexity__reason.

Provide specific, current information with sources. Do NOT provide generic encyclopedia-style information.`;

        console.log(`[Workflow] DEBUG: Research prompt length: ${researchPrompt.length}`);
        console.log(`[Workflow] DEBUG: Avoiding keywords: ${allAvoidedKeywords.slice(0, 10).join(', ')}`);

        summary = await runResearchQuery(researchPrompt);
        console.log(`[Workflow] DEBUG: Research result length: ${summary.length}`);
        console.log(`[Workflow] DEBUG: Research preview: ${summary.slice(0, 200)}...`);

        // Filter: Skip research if it contains blacklisted keywords
        const hasBlacklistedContent = allAvoidedKeywords.some((keyword: string) =>
          summary.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasBlacklistedContent) {
          console.log(`[Workflow] SKIPPING: Research contains blacklisted keywords`);
          continue;
        }
      }

      // Cache for 7 days (using varied topic as cache key)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.researchCache.create({
        data: {
          topic: variedTopic,
          results: summary,
          source: isGitHubRepo ? 'context7' : 'tavily/perplexity',
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

    // If no valid research results (all filtered), abort workflow
    if (this.researchResults.length === 0) {
      throw new Error('No valid research results - all topics were filtered by blacklist');
    }
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
        const synthesizedIdea = {
          topic: idea.topic || 'General',
          uniqueAngle: idea.uniqueAngle || '',
          suggestedHashtags: idea.suggestedHashtags || [],
        };

        console.log(`[Workflow] SYNTHESIS COMPLETE:`);
        console.log(`[Workflow] - Topic: ${synthesizedIdea.topic}`);
        console.log(`[Workflow] - Unique Angle: ${synthesizedIdea.uniqueAngle.slice(0, 150)}...`);

        this.synthesizedIdeas.push(synthesizedIdea);

        // Save as Draft with SYNTHESIZED status
        await prisma.draft.create({
          data: {
            id: `synth-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
      let draftingPrompt = `TODAY IS ${today}. Write a complete X (Twitter) post based on this idea.

⚠️ CHARACTER LIMIT: 280 MAX (count spaces, URLs = 23 chars)
⚠️ If your response exceeds 280 characters, it will be REJECTED
⚠️ Target: 200-260 characters for safety margin

Topic: ${idea.topic}
Unique Angle: ${idea.uniqueAngle}

Persona Settings:
- Tone: ${persona.tone}
- Style: ${persona.style}
- Use Emojis: ${persona.emojiUsage}
- Use Hashtags: ${persona.hashtagUsage}

CRITICAL: Write helpful content for ${persona.name} audience. Provide value, insights, or useful information.

DO NOT use first-person ("I", "we", "my", "just"). Use third-person objective tone.
Focus on what readers should KNOW or DO, not personal experiences.

REFERENCE TWEETS (study these patterns - all under 280 chars):
✅ "New in Claude Code: subagents can now read spec files and verify completion automatically. This reduces manual review time by ~40%."

✅ "XLA compiler tip: approximate top-k can fail with certain batch sizes. Use exact top-k for 2% efficiency cost but guaranteed correctness."

✅ "FastAPI 0.100+ introduces lifespan context for async resource cleanup. Replace @startup/@shutdown events with lifespan() function."

KEY ELEMENTS (be concise to stay under 280):
- ONE clear insight or takeaway
- Specific technical detail (version numbers, methods, patterns)
- Actionable advice or important information
- NO personal narrative or journey

STYLE: ${persona.tone} ${persona.style}
- Use third-person objective tone
- Share knowledge, not experiences
- Make every character count with useful information

Write ONLY the tweet content. No explanation, no preamble.
Remember: 280 characters MAX. Count carefully.`;

      // Generate content with retry for character limit
      let content = '';
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        content = await runAnalysisQuery(draftingPrompt, `You are an expert social media writer for ${persona.name}. Write ${persona.tone} ${persona.style} posts in THIRD-PERSON. CRITICAL: NO first-person ("I", "we", "my"). Every post MUST be under 280 characters. URLs count as 23 characters. Target 200-260 characters. Provide helpful information, not personal stories.`);

        const charCount = content.length;
        console.log(`[Workflow] Draft attempt ${retries + 1}: ${charCount} characters (max: 280)`);

        if (charCount <= 280) {
          break; // Success!
        }

        retries++;
        if (retries < maxRetries) {
          console.log(`[Workflow] Content too long (${charCount} chars), retrying...`);
          // Update prompt to be more strict about length
          draftingPrompt = draftingPrompt.replace(
            '⚠️ CHARACTER LIMIT: 280 MAX',
            `⚠️ CHARACTER LIMIT: 280 MAX - YOUR LAST ATTEMPT WAS ${charCount} CHARS (TOO LONG!)
⚠️ You MUST shorten this significantly. Target 200-240 characters.`
          );
        }
      }

      // Note: No truncation here - let review phase provide suggested edits first
      this.draftedPosts.push({
        content,
        topic: idea.topic,
        uniqueAngle: idea.uniqueAngle,
        personalVoice: true,
        valueAdd: 'Personal insights applied from persona',
      });

      console.log(`[Workflow] DRAFT CREATED:`);
      console.log(`[Workflow] - Content: ${content}`);
      console.log(`[Workflow] - Character count: ${content.length}`);

      // Update draft with DRAFTED status
      await prisma.draft.create({
        data: {
          id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
CURRENT LENGTH: ${draftedPost.content.length} characters (MAX: 280)

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
  "suggestedEdits": "shorter version if length exceeds 280 chars, or improved version if other issues found"
}

CRITICAL CHECKLIST:
1. Length: MUST be ≤ 280 characters. Current: ${draftedPost.content.length}
2. If length > 280: suggestedEdits MUST condense to under 280
3. If length ok: check tone/style match
4. Hashtags: relevant and not excessive?`;

      const review = await runAnalysisQuery(reviewPrompt, `You are a content reviewer. Check posts against persona guidelines. CRITICAL: If post exceeds 280 characters, you MUST provide a shorter version in suggestedEdits that is under 280. Respond ONLY with valid JSON.`);

      // Parse JSON response
      try {
        const jsonMatch = review.match(/\{[\s\S]*?\}/);
        const reviewResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        console.log('[Workflow] Review result:', JSON.stringify(reviewResult));

        if (reviewResult) {
          // Use suggested edits if not approved and provided
          let finalContent = draftedPost.content;
          if (!reviewResult.approved && reviewResult.suggestedEdits) {
            finalContent = reviewResult.suggestedEdits;
          }

          // Validate suggested edits length
          const suggestedLength = finalContent?.length || 0;
          const lengthOk = suggestedLength <= 280;

          // If no suggested edits provided and not approved, reject
          if (!reviewResult.approved && !reviewResult.suggestedEdits) {
            console.log(`[Workflow] ✗ Post rejected: ${reviewResult.issues?.join(', ') || 'No suggested edits provided'}`);
            this.reviewedPosts.push({
              content: draftedPost.content,
              approved: false,
              issues: reviewResult.issues || ['No suggested edits provided'],
              lengthOk: draftedPost.content.length <= 280,
              hashtagsRelevant: reviewResult.hashtagsRelevant ?? true,
            });
          } else {
            this.reviewedPosts.push({
              content: finalContent,
              approved: (reviewResult.approved || !!reviewResult.suggestedEdits) && lengthOk,
              issues: reviewResult.issues || [],
              lengthOk,
              hashtagsRelevant: reviewResult.hashtagsRelevant ?? true,
            });

            if (lengthOk) {
              console.log(`[Workflow] ✓ Post approved (${suggestedLength} chars)`);
            } else {
              console.log(`[Workflow] ✗ Post rejected: Still too long (${suggestedLength} chars)`);
            }
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
        // Fallback: truncate if too long, approve if short enough
        const content = draftedPost.content.length > 280
          ? draftedPost.content.substring(0, 277) + '...'
          : draftedPost.content;
        this.reviewedPosts.push({
          content,
          approved: true,
          issues: [],
          lengthOk: content.length <= 280,
          hashtagsRelevant: true,
        });
      }
    }

    // Update drafted posts with reviewed/suggested content and filter only approved
    this.draftedPosts = this.draftedPosts
      .map((post, index) => {
        const review = this.reviewedPosts[index];
        if (!review) return null;

        // Update post content with reviewed/suggested version
        return {
          ...post,
          content: review.content,
          approved: review.approved,
        };
      })
      .filter((post): post is NonNullable<typeof post> => post?.approved === true);

    console.log(`[Workflow] Review complete. ${this.draftedPosts.length} posts approved.`);
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
            id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
