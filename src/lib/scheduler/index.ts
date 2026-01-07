/**
 * Job Scheduler Service
 *
 * Singleton scheduler using node-cron with globalThis pattern for hot reload support.
 * Manages autonomous content posting jobs based on frequency settings.
 *
 * Uses CronJob from 'cron' package (https://www.npmjs.com/package/cron)
 */

import { CronJob } from 'cron';
import { prisma } from '@/lib/db';
import { startAutonomousWorkflow } from '@/lib/autonomous-workflow';

const globalForScheduler = globalThis as unknown as {
  scheduler: JobScheduler | undefined;
};

export interface ScheduledJobData {
  name: string;
  cronExpression: string;
  frequency: number;
  personaId: string;
  enabled: boolean;
  timezone?: string;
}

export class JobScheduler {
  private jobs = new Map<string, CronJob>();
  private initialized = false;
  private runningWorkflow = false;

  /**
   * Initialize scheduler from database
   * Loads all enabled scheduled jobs and registers them
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[Scheduler] Already initialized, skipping...');
      return;
    }

    console.log('[Scheduler] Initializing scheduler...');

    const jobs = await prisma.scheduledJob.findMany({
      where: { enabled: true },
      include: { persona: true },
    });

    console.log(`[Scheduler] Found ${jobs.length} enabled jobs in database`);

    for (const job of jobs) {
      try {
        const cronJob = new CronJob(
          job.cronExpression,
          () => this.executeJob(job.id),
          null,
          true,
          job.timezone || 'UTC'
        );
        this.jobs.set(job.id, cronJob);
        console.log(`[Scheduler] Registered job: ${job.name} (${job.cronExpression})`);
      } catch (error) {
        console.error(`[Scheduler] Failed to register job ${job.name}:`, error);
      }
    }

    this.initialized = true;
    console.log(`[Scheduler] Initialization complete. ${this.jobs.size} jobs active.`);
  }

  /**
   * Execute a scheduled job
   * Triggers autonomous workflow if conditions are met
   */
  private async executeJob(jobId: string): Promise<void> {
    try {
      console.log(`[Scheduler] Executing job: ${jobId}`);

      const job = await prisma.scheduledJob.findUnique({
        where: { id: jobId },
        include: { persona: true },
      });

      if (!job || !job.enabled) {
        console.log(`[Scheduler] Job ${jobId} not found or disabled, skipping`);
        return;
      }

      // Check if autonomous mode is enabled
      const settings = await prisma.settings.findFirst();
      if (!settings?.autonomousEnabled) {
        console.log('[Scheduler] Autonomous mode disabled, skipping workflow');
        await this.updateJobStatus(jobId, 'skipped', 'Autonomous mode disabled');
        return;
      }

      // Check for running workflow
      if (this.runningWorkflow) {
        console.log('[Scheduler] Workflow already running, skipping');
        await this.updateJobStatus(jobId, 'skipped', 'Workflow already running');
        return;
      }

      // Check rate limit (17 posts/day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const postsToday = await prisma.post.count({
        where: { postedAt: { gte: today } },
      });

      if (postsToday >= 17) {
        console.log('[Scheduler] Daily rate limit reached, skipping workflow');
        await this.updateJobStatus(jobId, 'skipped', 'Daily rate limit reached');
        return;
      }

      console.log(`[Scheduler] Starting autonomous workflow for persona: ${job.personaId}`);
      this.runningWorkflow = true;

      await this.updateJobStatus(jobId, 'running', null);

      // Start autonomous workflow (maxPosts: 1 for scheduled runs)
      if (!job.personaId) {
        throw new Error('Job has no personaId');
      }

      await startAutonomousWorkflow({
        personaId: job.personaId,
        topicCount: 5,
        maxPosts: 1,
      });

      await this.updateJobStatus(jobId, 'completed', null);

      // Update job run stats
      await prisma.scheduledJob.update({
        where: { id: jobId },
        data: {
          lastRunAt: new Date(),
          runCount: { increment: 1 },
        },
      });

      console.log(`[Scheduler] Job ${jobId} completed successfully`);
    } catch (error) {
      console.error(`[Scheduler] Job ${jobId} failed:`, error);
      await this.updateJobStatus(jobId, 'failed', (error as Error).message);

      // Update job error
      await prisma.scheduledJob.update({
        where: { id: jobId },
        data: {
          lastError: (error as Error).message,
        },
      });
    } finally {
      this.runningWorkflow = false;
    }
  }

  /**
   * Add a new scheduled job
   */
  async addJob(data: ScheduledJobData): Promise<void> {
    console.log(`[Scheduler] Adding job: ${data.name}`);

    // Create in database
    const job = await prisma.scheduledJob.create({
      data: {
        name: data.name,
        cronExpression: data.cronExpression,
        frequency: data.frequency,
        personaId: data.personaId,
        timezone: data.timezone || 'UTC',
        enabled: data.enabled,
      },
    });

    // Register cron job
    const cronJob = new CronJob(
      data.cronExpression,
      () => this.executeJob(job.id),
      null,
      data.enabled,
      data.timezone || 'UTC'
    );

    this.jobs.set(job.id, cronJob);
    console.log(`[Scheduler] Job added: ${data.name} (${data.cronExpression})`);
  }

  /**
   * Remove a scheduled job
   */
  async removeJob(jobId: string): Promise<void> {
    console.log(`[Scheduler] Removing job: ${jobId}`);

    // Stop cron job
    const cronJob = this.jobs.get(jobId);
    if (cronJob) {
      cronJob.stop();
      this.jobs.delete(jobId);
    }

    // Delete from database
    await prisma.scheduledJob.delete({
      where: { id: jobId },
    });

    console.log(`[Scheduler] Job removed: ${jobId}`);
  }

  /**
   * Update a scheduled job
   */
  async updateJob(jobId: string, updates: Partial<ScheduledJobData>): Promise<void> {
    console.log(`[Scheduler] Updating job: ${jobId}`);

    // Stop existing job
    const cronJob = this.jobs.get(jobId);
    if (cronJob) {
      cronJob.stop();
      this.jobs.delete(jobId);
    }

    // Update database
    const job = await prisma.scheduledJob.update({
      where: { id: jobId },
      data: {
        name: updates.name,
        cronExpression: updates.cronExpression,
        frequency: updates.frequency,
        personaId: updates.personaId,
        timezone: updates.timezone || 'UTC',
        enabled: updates.enabled ?? true,
      },
    });

    // Recreate cron job
    const newCronJob = new CronJob(
      job.cronExpression,
      () => this.executeJob(jobId),
      null,
      job.enabled,
      job.timezone || 'UTC'
    );

    this.jobs.set(jobId, newCronJob);
    console.log(`[Scheduler] Job updated: ${jobId}`);
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(jobId: string, status: string, error: string | null): Promise<void> {
    await prisma.scheduledJob.update({
      where: { id: jobId },
      data: {
        lastStatus: status,
        lastError: error,
      },
    });
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    initialized: boolean;
    jobsCount: number;
    runningWorkflow: boolean;
    jobs: any[];
  } {
    return {
      initialized: this.initialized,
      jobsCount: this.jobs.size,
      runningWorkflow: this.runningWorkflow,
      jobs: Array.from(this.jobs.keys()),
    };
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    console.log('[Scheduler] Shutting down scheduler...');

    for (const [id, job] of this.jobs.entries()) {
      job.stop();
      console.log(`[Scheduler] Stopped job: ${id}`);
    }

    this.jobs.clear();
    this.initialized = false;
    console.log('[Scheduler] Shutdown complete');
  }
}

// Export singleton instance
export const scheduler = globalForScheduler.scheduler ?? new JobScheduler();

if (process.env.NODE_ENV !== 'production') {
  globalForScheduler.scheduler = scheduler;
}

export default scheduler;
