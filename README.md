# Dashboard

Monorepo containing dashboard applications and related tooling.

## Structure

| Directory | Purpose |
|-----------|---------|
| `x-content-dashboard/` | Next.js content dashboard app |
| `.claude/` | Agent Harness configuration |

## x-content-dashboard

Next.js application with Prisma ORM.

### Setup

```bash
cd x-content-dashboard
npm install
```

### Database

```bash
npx prisma migrate dev
npx prisma generate
```

### Run

```bash
npm run dev
```

Visit <http://localhost:3000>

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npx prisma studio` | Database GUI |
| `npx prisma migrate dev` | Run migrations |
