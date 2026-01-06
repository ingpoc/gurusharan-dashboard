# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL or SQLite (for local development)
- Vercel account (for production deployment)
- X (Twitter) Developer account
- Anthropic API key

## Environment Variables

### Required

```bash
# Database
DATABASE_URL="file:./dev.db"  # or PostgreSQL URL

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-..."

# X (Twitter) OAuth
X_API_KEY="your-x-api-key"
X_API_SECRET="your-x-api-secret"
X_CALLBACK_URL="http://localhost:3000/api/auth/x/callback"
```

### Optional (Enhanced Features)

```bash
# Tavily for web research
TAVILY_API_KEY="tvly-..."

# Context-graph for learning
VOYAGE_API_KEY="your-voyage-key"

# Vercel cron security
CRON_SECRET="your-random-secret"
```

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo>
cd dashboard
npm install
```

### 2. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Vercel Deployment

### 1. Prepare for Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login
```

### 2. Deploy

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL (use Vercel Postgres or external Postgres)
# - ANTHROPIC_API_KEY
# - X_API_KEY, X_API_SECRET, X_CALLBACK_URL
# - CRON_SECRET (generate random string)
# - (Optional) TAVILY_API_KEY, VOYAGE_API_KEY
```

### 3. Configure Cron Jobs

The `vercel.json` file includes cron configuration:

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

Times are in UTC. Adjust for your timezone.

### 4. Update X OAuth Callback

In X Developer Portal:

1. Go to your app settings
2. Update callback URL: `https://your-app.vercel.app/api/auth/x/callback`
3. Update website URL: `https://your-app.vercel.app`

## Database Migration

### SQLite → PostgreSQL (Vercel Postgres)

```bash
# Export SQLite data
sqlite3 prisma/dev.db .dump > dump.sql

# Import to PostgreSQL
psql $DATABASE_URL < dump.sql

# Update schema.prisma provider
# provider: "sqlite" → provider: "postgresql"

# Regenerate and push
npx prisma generate
npx prisma db push
```

## Monitoring

### Health Check

```bash
curl https://your-app.vercel.app/api/health
```

### Autonomous Status

```bash
curl https://your-app.vercel.app/api/autonomous/status
```

### View Logs

```bash
# Vercel logs
vercel logs

# Real-time
vercel logs --follow
```

## Troubleshooting

### Cron Jobs Not Running

1. Check CRON_SECRET is set in Vercel env vars
2. Verify cron configuration in `vercel.json`
3. Check Vercel cron logs: `vercel logs --cron`

### Database Connection Issues

Vercel Postgres requires connection pooling:

```env
DATABASE_URL="postgres://user:pass@host/db?pgbouncer=true"
```

### X OAuth Failing

1. Verify callback URL matches X Developer Portal
2. Check X API credentials in Vercel env vars
3. Ensure X app has read/write permissions

### Autonomous Workflow Stuck

1. Check `/api/autonomous/status` endpoint
2. Verify `autonomousEnabled` is true in settings
3. Review workflow runs in database
4. Check logs for errors

## Security Checklist

- [ ] CRON_SECRET is set (random 32+ chars)
- [ ] X OAuth callback URL is HTTPS
- [ ] Database connection uses SSL
- [ ] API keys are in environment variables (not committed)
- [ ] Rate limiting is configured (17 posts/day for X)
- [ ] Credit budget is enforced (33 credits/day)

## Performance Optimization

### Enable Caching

```typescript
// Research is cached for 7 days in ResearchCache
// Workflow runs are cached in database
```

### Reduce API Calls

```bash
# Set lower topicCount for fewer research queries
topicCount: 3  # instead of 5
```

### Database Indexes

```prisma
// Already included in schema.prisma:
@@index([topic])      // ResearchCache
@@index([expiresAt])   // ResearchCache
@@index([status])      // WorkflowRun
@@index([startedAt])   // WorkflowRun
```

## Scaling

### Horizontal Scaling

- Multiple instances share same database
- Use distributed locking for workflow coordination
- Configure Vercel regions for global deployment

### Vertical Scaling

- Increase Vercel function timeout (max 60s for hobby)
- Upgrade to Pro plan for 10s function timeout
- Use external cron service for more control

## Backup and Recovery

### Database Backup

```bash
# Vercel Postgres (automatic backups)
# Access via Vercel dashboard

# Manual backup
pg_dump $DATABASE_URL > backup.sql
```

### Restore

```bash
psql $DATABASE_URL < backup.sql
```

## Continuous Deployment

Vercel automatically deploys on push to main branch:

```bash
git push origin main
```

For manual deployment:

```bash
vercel --prod
```
