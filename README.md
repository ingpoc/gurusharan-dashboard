# X Content Dashboard

AI-powered autonomous content creation system for X (Twitter). Researches, drafts, reviews, posts, and learns from content performance.

## Features

- **Autonomous Workflow** - Fully automated content creation pipeline
- **X (Twitter) Integration** - OAuth 2.0 with auto token refresh
- **Persona Management** - Custom voice, tone, and style per persona
- **Draft Management** - Save and schedule posts
- **Performance Analytics** - Track engagement and optimize content
- **Cron Jobs** - Scheduled posting (9AM, 12PM, 6PM UTC)
- **Smart Caching** - 7-day research cache reduces API costs
- **Credit Budgeting** - 33 credits/day budget enforcement
- **Error Recovery** - 3-retry logic with fallbacks

## Architecture

### Autonomous Workflow Phases

```
RESEARCHING → SYNTHESIZING → DRAFTING → REVIEWING → POSTING → LEARNING
```

| Phase | Description | Credits |
|-------|-------------|---------|
| Research | Fetch current info (Tavily/Claude) | 5-10 |
| Synthesis | Generate unique content ideas | ~5 |
| Drafting | Write posts with persona voice | ~3 |
| Review | Quality check (length, uniqueness) | 0 |
| Posting | Publish to X (rate limited) | 0 |
| Learning | Store patterns in context-graph | 0 |

**Total per workflow: ~15-20 credits**

## Setup

### Prerequisites

- Node.js 18+
- X (Twitter) Developer account
- Anthropic API key

### Installation

```bash
npm install
npx prisma generate
npx prisma db push
```

### Environment Variables

```bash
# Required
DATABASE_URL="file:./dev.db"  # or PostgreSQL URL
ANTHROPIC_API_KEY="sk-ant-..."
X_API_KEY="your-x-api-key"
X_API_SECRET="your-x-api-secret"
X_CALLBACK_URL="http://localhost:3000/api/auth/x/callback"

# Optional (enhanced features)
TAVILY_API_KEY="tvly-..."        # Web research
VOYAGE_API_KEY="..."              # Context-graph embeddings
CRON_SECRET="random-secret"       # Vercel cron security
```

### Run Development Server

```bash
npm run dev
```

Visit <http://localhost:3000>

## API Endpoints

### Autonomous Workflow

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/autonomous/trigger` | POST | Start autonomous workflow |
| `/api/autonomous/status` | GET | Get workflow status |
| `/api/cron/daily-content` | GET | Vercel cron endpoint |

### Content

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/drafts` | GET/POST | List/create drafts |
| `/api/personas` | GET/POST | List/create personas |
| `/api/settings` | GET/PUT | Manage settings |

### X (Twitter) OAuth

| Endpoint | Description |
|----------|-------------|
| `/api/auth/x/connect` | Start OAuth flow |
| `/api/auth/x/callback` | OAuth callback |
| `/api/auth/x/status` | Get connection status |
| `/api/auth/x/disconnect` | Disconnect account |

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview and stats |
| Chat | `/chat` | AI content assistant |
| Drafts | `/drafts` | Draft management |
| Settings | `/settings` | Persona and X account |
| Autonomous | `/autonomous` | Workflow monitor and performance |

## Deployment

### Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Configure environment variables in Vercel dashboard:

- `DATABASE_URL` (use Vercel Postgres or external)
- `ANTHROPIC_API_KEY`
- `X_API_KEY`, `X_API_SECRET`, `X_CALLBACK_URL`
- `CRON_SECRET` (generate random string)

### Cron Jobs

The `vercel.json` file configures cron jobs for 9AM, 12PM, and 6PM UTC.

## Documentation

- [Autonomous Architecture](docs/autonomous-architecture.md) - Workflow internals
- [MCP Integration](docs/mcp-integration.md) - Model Context Protocol setup
- [Deployment](docs/deployment.md) - Full deployment guide

## Credit Usage Strategy

### Daily Budget: 33 credits

| Run | Credits | Runs/Day | Total |
|-----|---------|----------|-------|
| 1 | ~20 | 1 | 20 |
| 2 | ~20 | 2 | 40 (exceeds budget) |

**Recommended**: 1 autonomous run per day

### Cost Optimization

- Enable `autonomousEnabled` only when needed
- Research cached for 7 days (ResearchCache)
- Lower `topicCount` to reduce API calls
- Use context-graph to avoid重复 research

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npx prisma studio` | Database GUI |
| `npx prisma db push` | Push schema changes |
| `npx prisma generate` | Generate Prisma client |

## Troubleshooting

### Workflow stuck in RUNNING

- Check `/api/autonomous/status`
- Verify database connection
- Review logs: `logs/nextjs.log`

### Posts not publishing

- Verify X access token (auto-refresh)
- Check rate limit (17 posts/day)
- Ensure `autonomousEnabled` is true

### High credit usage

- Reduce `topicCount` in workflow input
- Verify ResearchCache is working
- Check for duplicate workflow runs
