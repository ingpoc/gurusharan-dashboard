/**
 * Instrumentation Hook
 *
 * Runs when the Next.js server starts (via instrumentation hook in next.config.ts)
 * Initializes the job scheduler for autonomous content posting.
 *
 * Documentation: https://nextjs.org/docs/app/building-your-application/configuring/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { scheduler } = await import('./lib/scheduler');
    await scheduler.initialize();
    console.log('[Instrumentation] Scheduler initialized on server startup');
  }
}
