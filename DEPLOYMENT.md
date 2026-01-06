# Vercel Deployment Guide

## Prerequisites

1. X (Twitter) Developer Account
2. Anthropic API Key
3. Vercel Account
4. GitHub Account (for Vercel integration)

## Environment Variables

Set these in Vercel Dashboard > Settings > Environment Variables:

```bash
ANTHROPIC_API_KEY=your-anthropic-api-key
DATABASE_URL=postgresql://user:password@host:5432/database
X_CLIENT_ID=your-x-client-id
X_CLIENT_SECRET=your-x-client-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Database Setup

For production, use PostgreSQL (not SQLite which is for local dev):

1. **Option A: Vercel Postgres**
   - In Vercel Dashboard, go to Storage
   - Create a new Postgres database
   - Copy the connection string to `DATABASE_URL`

2. **Option B: External PostgreSQL**
   - Use Supabase, Neon, or other Postgres service
   - Add connection string as `DATABASE_URL`

## Deployment Steps

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `x-content-dashboard`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic key | Production |
| `DATABASE_URL` | Your Postgres connection | Production |
| `X_CLIENT_ID` | Your X OAuth client ID | Production |
| `X_CLIENT_SECRET` | Your X OAuth client secret | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

### 4. Update X OAuth Callback URL

In your X Developer Portal:

1. Go to your App Settings
2. Add callback URL: `https://your-app.vercel.app/api/auth/x/callback`
3. Save changes

### 5. Run Database Migrations

After first deployment, run Prisma migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Push schema to database
npx prisma db push
```

### 6. Deploy

```bash
vercel --prod
```

## Post-Deployment Checklist

- [ ] App loads at production URL
- [ ] X OAuth connection works
- [ ] Can create drafts via chat
- [ ] Stats display correctly
- [ ] Environment variables are set (not `.env`)
- [ ] Database migrations completed successfully

## Troubleshooting

### Build Fails

Check environment variables are set correctly in Vercel Dashboard.

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Run `npx prisma db push` after deployment
- Check Prisma schema matches database

### X OAuth Not Working

- Verify callback URL matches X Developer Portal settings
- Check `X_REDIRECT_URI` environment variable
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Edge Runtime Issues

The app uses Edge runtime for some API routes. If you encounter issues:

1. Remove `export const runtime = 'edge'` from API routes
2. Or ensure database is PostgreSQL (not SQLite)

## Local Development with Production Database

To test with production database locally:

```bash
DATABASE_URL="postgresql://..." npm run dev
```

## Useful Commands

```bash
# Check environment variables
vercel env ls

# View logs
vercel logs

# Redeploy
vercel --prod
```
