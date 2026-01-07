/**
 * Frequency Calculator
 *
 * Calculates posting times evenly distributed across the day (6AM-10PM UTC)
 * for autonomous content scheduling.
 */

import { prisma } from '@/lib/db';

export interface PostingTime {
  hour: number;
  minute: number;
  cronExpression: string;
}

/**
 * Calculate posting times evenly distributed (6AM-10PM UTC)
 *
 * @param frequency - Number of posts per day (1-17)
 * @returns Array of posting times with cron expressions
 */
export function calculatePostingTimes(frequency: number): PostingTime[] {
  const times: PostingTime[] = [];
  const startHour = 6;
  const endHour = 22;
  const totalHours = endHour - startHour;

  if (frequency === 1) {
    // Single post at noon
    times.push({
      hour: 12,
      minute: 0,
      cronExpression: '0 12 * * *',
    });
  } else if (frequency <= totalHours) {
    // Distribute evenly across hours
    const interval = totalHours / frequency;
    for (let i = 0; i < frequency; i++) {
      const hour = Math.floor(startHour + i * interval);
      const minute = Math.round((i * interval % 1) * 60);
      times.push({
        hour,
        minute,
        cronExpression: `${minute} ${hour} * * *`,
      });
    }
  } else {
    // More posts than hours - distribute every hour with minutes
    const postsPerHour = Math.ceil(frequency / totalHours);
    const minuteInterval = Math.floor(60 / postsPerHour);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60 && times.length < frequency; minute += minuteInterval) {
        times.push({
          hour,
          minute,
          cronExpression: `${minute} ${hour} * * *`,
        });
      }
    }
  }

  return times.sort((a, b) => a.hour - b.hour || a.minute - b.minute);
}

/**
 * Rebuild scheduled jobs when frequency changes
 *
 * @param frequency - New frequency setting (1-17 posts/day)
 * @param personaId - Active persona ID
 * @param scheduler - JobScheduler instance
 */
export async function rebuildJobsForFrequency(
  frequency: number,
  personaId: string,
  scheduler: any
): Promise<void> {
  console.log(`[Scheduler] Rebuilding jobs for frequency: ${frequency}, persona: ${personaId}`);

  const times = calculatePostingTimes(frequency);
  console.log(`[Scheduler] Calculated ${times.length} posting times:`, times.map(t => `${t.hour}:${String(t.minute).padStart(2, '0')}`).join(', '));

  // Delete old autonomous-post jobs
  const deleted = await prisma.scheduledJob.deleteMany({
    where: {
      name: { startsWith: 'autonomous-post-' },
    },
  });
  console.log(`[Scheduler] Deleted ${deleted.count} old jobs`);

  // Create new jobs
  for (const time of times) {
    const jobName = `autonomous-post-${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
    await scheduler.addJob({
      name: jobName,
      cronExpression: time.cronExpression,
      frequency,
      personaId,
      enabled: true,
    });
    console.log(`[Scheduler] Created job: ${jobName} (${time.cronExpression})`);
  }

  console.log(`[Scheduler] Job rebuild complete. ${times.length} jobs scheduled.`);
}
