# Autonomous Workflow Architecture

## Overview

The autonomous workflow engine creates, reviews, and publishes social media content without manual intervention. It integrates research, synthesis, drafting, review, posting, and learning into a unified state machine.

## State Machine

```
IDLE → RESEARCHING → SYNTHESIZING → DRAFTING → REVIEWING → POSTING → LEARNING → IDLE
                 ↓                                                        ↓
              FAILED ←─────────────────────────────────────────────────────┘
```

## Phases

### 1. Research (RESEARCHING)

- Queries context-graph for successful topics
- Uses Tavily MCP for current research
- Caches results for 7 days (ResearchCache)
- Credit cost: 5-10 credits per topic

### 2. Synthesis (SYNTHESIZING)

- Claude analyzes research data
- Identifies unique angles (not copying experts)
- Generates 3-5 content ideas
- Stores as Draft with status SYNTHESIZED

### 3. Drafting (DRAFTING)

- Drafts full posts for each idea
- Applies persona voice/tone/style from Settings
- Adds personal insights and value-add
- Stores as Draft with status DRAFTED

### 4. Review (REVIEWING)

- Quality check: uniqueness, voice match, value
- Length check: under 280 characters
- Hashtag relevance validation
- Stores as Draft with status REVIEWED
- Only approved posts proceed to posting

### 5. Posting (POSTING)

- Checks X rate limits (17 posts/day)
- Posts at optimal times (9AM, 12PM, 6PM)
- Saves to Post history
- Updates daily counter

### 6. Learning (LEARNING)

- Stores decisions in context-graph
- Tracks: topic, tone, time, outcome
- Queries context-graph for successful patterns
- Optimizes next iteration

## Components

### Core Engine (`src/lib/autonomous-workflow.ts`)

```typescript
class AutonomousWorkflowEngine {
  start(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  getState(): WorkflowState
}
```

### API Endpoints

- `POST /api/autonomous/trigger` - Start workflow manually
- `GET /api/autonomous/status` - Get workflow status
- `GET /api/cron/daily-content` - Vercel cron endpoint

### Database Models

- `WorkflowRun` - Tracks workflow execution
- `ResearchCache` - Caches research results (7-day expiry)
- `Post` - Published post history
- `Draft` - Content at various stages
- `PostAnalytics` - Engagement tracking

## Credit System

### Daily Budget: 33 credits

| Phase | Cost per Run | Notes |
|-------|--------------|-------|
| Research | 5-10 credits | Depends on topic count |
| Synthesis | ~5 credits | Claude Sonnet |
| Drafting | ~3 credits | Claude Haiku |
| Review | 0 credits | Local validation |
| Posting | 0 credits | X API (free tier) |
| Learning | 0 credits | Context-graph storage |

**Total per workflow: ~15-20 credits**

### Credit Enforcement

- `getCreditUsageSummary()` tracks daily usage
- Workflow pauses if daily budget exceeded
- Resets at midnight UTC

## Error Handling

### Retry Logic

```typescript
private maxRetries = 3;
private retryCount = 0;
```

- Failed phases retry up to 3 times
- After max retries, workflow fails
- Error stored in `WorkflowRun.error`

### Fallbacks

1. **Tavily unavailable** → Falls back to Claude knowledge
2. **X API down** → Skips posting, stores as Draft
3. **Context-graph unreachable** → Continues without learning

## MCP Integrations

### Tavily MCP (Research)

- Endpoint: Research phase
- Used for: Current trends and information
- Cached: 7 days in ResearchCache

### Context-Graph MCP (Learning)

- Endpoint: Learning phase
- Used for: Pattern storage and retrieval
- Stored: Successful post patterns

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
X_API_KEY=...

# Optional
TAVILY_API_KEY=tvly-...
CRON_SECRET=...  # For Vercel cron security
```

### Settings (Database)

```typescript
{
  autonomousEnabled: boolean;  // Master switch
  activePersonaId: string;     // Which persona to use
}
```

## Deployment

### Vercel Cron Setup

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-content?secret={{CRON_SECRET}}",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/daily-content?secret={{CRON_SECRET}}",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/daily-content?secret={{CRON_SECRET}}",
      "schedule": "0 18 * * *"
    }
  ]
}
```

### Manual Trigger

```bash
curl -X POST https://your-app.vercel.app/api/autonomous/trigger \
  -H "Content-Type: application/json" \
  -d '{"personaId": "persona-id-here"}'
```

## Monitoring

### Status Endpoint

```bash
curl https://your-app.vercel.app/api/autonomous/status
```

Returns:

```json
{
  "enabled": true,
  "currentPhase": "RESEARCHING",
  "activeWorkflow": {...},
  "recentWorkflows": [...],
  "creditUsage": {
    "totalCredits": 150,
    "todayCredits": 18,
    "remainingBudget": 15
  }
}
```

## UI Components

- `WorkflowMonitor` - Real-time status display (src/app/autonomous/page.tsx)
- `PerformanceStats` - History and analytics

## Troubleshooting

### Workflow stuck in RUNNING

- Check logs: `logs/nextjs.log`
- Verify database connection
- Check API key validity

### Posts not publishing

- Verify X access token (refresh if expired)
- Check rate limit (17 posts/day)
- Ensure `autonomousEnabled` is true

### High credit usage

- Check `topicCount` in workflow input
- Verify cache is working (ResearchCache)
- Review workflow runs for duplicates
