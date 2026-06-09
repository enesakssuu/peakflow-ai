// ============================================================
// PeakFlow AI — Deterministic AI Engine
// ============================================================
// All functions are pure (no API calls). Each function is
// designed with a clear interface so it can be replaced with
// an OpenAI-powered version later without refactoring.
// ============================================================

import type {
  Task,
  FocusSession,
  DailyReview,
  TaskRecommendation,
  UserContext,
  WeeklyInsights,
  MomentumData,
} from '@/types';

// ── Task Scoring ─────────────────────────────────────────────

/**
 * Calculate a score for a task based on its properties and user context.
 * Higher score = should be worked on next.
 *
 * Formula:
 *   score = (impactScore × 25) + durationWeight + timeOfDayBonus + energyBonus
 */
export function calculateTaskScore(task: Task, context: UserContext): number {
  // Impact is the primary factor (25-125 points)
  const impactPoints = task.impactScore * 25;

  // Shorter tasks get a slight boost when energy is low or late in the day
  const durationWeight = getDurationWeight(task.estimatedDuration, context);

  // Time-of-day bonus: deep work tasks in the morning, lighter tasks in afternoon
  const timeBonus = getTimeOfDayBonus(task, context.currentHour);

  // Energy-based adjustment
  const energyBonus = getEnergyBonus(context.recentEnergy, task.estimatedDuration);

  return Math.round(impactPoints + durationWeight + timeBonus + energyBonus);
}

function getDurationWeight(duration: number, context: UserContext): number {
  // If user has already done a lot of focus work, prefer shorter tasks
  if (context.totalFocusToday > 180) {
    return duration <= 30 ? 15 : duration <= 60 ? 5 : -5;
  }
  // Otherwise slightly prefer medium-length tasks (sweet spot)
  if (duration <= 15) return 5;
  if (duration <= 45) return 10;
  if (duration <= 90) return 5;
  return 0;
}

function getTimeOfDayBonus(task: Task, hour: number): number {
  // Morning (6-12): boost high-impact, longer tasks
  if (hour >= 6 && hour < 12) {
    return task.impactScore >= 4 ? 10 : 0;
  }
  // Afternoon (12-17): neutral
  if (hour >= 12 && hour < 17) {
    return 0;
  }
  // Evening (17+): boost shorter, lower-impact tasks
  return task.estimatedDuration <= 30 ? 10 : -5;
}

function getEnergyBonus(energy: number | null, duration: number): number {
  if (energy === null) return 0;
  // High energy: prefer longer, more impactful tasks
  if (energy >= 7) return duration >= 45 ? 10 : 0;
  // Low energy: prefer shorter, quick-win tasks
  if (energy <= 4) return duration <= 30 ? 15 : -10;
  return 0;
}

// ── Task Recommendation ─────────────────────────────────────

/**
 * Returns the top recommended task with reasoning.
 * This is the main function called by the dashboard.
 */
export function getRecommendedTask(
  tasks: Task[],
  sessions: FocusSession[],
  reviews: DailyReview[]
): TaskRecommendation | null {
  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  if (activeTasks.length === 0) return null;

  const context = buildUserContext(tasks, sessions, reviews);

  const scored = activeTasks.map((task) => ({
    task,
    score: calculateTaskScore(task, context),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  return {
    task: top.task,
    score: top.score,
    reasoning: generateReasoning(top.task, top.score, context),
  };
}

// ── User Context Builder ─────────────────────────────────────

export function buildUserContext(
  tasks: Task[],
  sessions: FocusSession[],
  reviews: DailyReview[]
): UserContext {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && (t.completedAt || t.createdAt) >= todayStart
  ).length;

  const todaySessions = sessions.filter((s) => s.startTime >= todayStart);
  const totalFocusToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  const recentReview = reviews.length > 0 ? reviews[0] : null;
  const recentEnergy = recentReview ? recentReview.energy : null;

  // Calculate streak (consecutive days with at least one completed task)
  const streakDays = calculateStreak(tasks);

  return {
    currentHour: now.getHours(),
    completedToday,
    totalFocusToday,
    recentEnergy,
    streakDays,
  };
}

function calculateStreak(tasks: Task[]): number {
  const completed = tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => {
      const aTime = (a.completedAt || a.createdAt).getTime();
      const bTime = (b.completedAt || b.createdAt).getTime();
      return bTime - aTime;
    });

  if (completed.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(checkDate);
    const dayEnd = new Date(checkDate);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const hasCompleted = completed.some((t) => {
      const compDate = t.completedAt || t.createdAt;
      return compDate >= dayStart && compDate < dayEnd;
    });

    if (hasCompleted) {
      streak++;
    } else if (i > 0) {
      break; // streak broken (skip today if nothing completed yet)
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ── AI Reasoning Generator ──────────────────────────────────

export function generateReasoning(
  task: Task,
  score: number,
  context: UserContext
): string {
  const parts: string[] = [];

  // Impact reasoning
  if (task.impactScore >= 4) {
    parts.push(`This is a high-impact task (${task.impactScore}/5) that will move the needle significantly.`);
  } else if (task.impactScore >= 3) {
    parts.push(`This task has a solid impact score of ${task.impactScore}/5.`);
  } else {
    parts.push(`A quick-win task that will build your momentum.`);
  }

  // Time-of-day reasoning
  const hour = context.currentHour;
  if (hour >= 6 && hour < 12) {
    parts.push(`Morning is your peak time for deep work — perfect for tackling this.`);
  } else if (hour >= 12 && hour < 17) {
    parts.push(`Good time to maintain your afternoon momentum.`);
  } else {
    parts.push(`A well-scoped task to close out the day strong.`);
  }

  // Duration reasoning
  if (task.estimatedDuration <= 30) {
    parts.push(`At ${task.estimatedDuration} minutes, it's a focused sprint.`);
  } else if (task.estimatedDuration <= 60) {
    parts.push(`A solid ${task.estimatedDuration}-minute work session.`);
  } else {
    parts.push(`Block out ${task.estimatedDuration} minutes of deep focus for this.`);
  }

  // Energy reasoning
  if (context.recentEnergy !== null) {
    if (context.recentEnergy >= 7) {
      parts.push(`Your energy is high — great time to push forward.`);
    } else if (context.recentEnergy <= 4) {
      parts.push(`Your energy has been lower lately. This task is well-suited for that.`);
    }
  }

  // Streak reasoning
  if (context.streakDays >= 3) {
    parts.push(`You're on a ${context.streakDays}-day streak. Keep it going!`);
  }

  return parts.join(' ');
}

// ── Momentum Score ───────────────────────────────────────────

/**
 * Calculate a momentum score (0-100) based on recent activity.
 * Factors: completed tasks, focus time, daily reviews, streak.
 */
export function calculateMomentumScore(
  tasks: Task[],
  sessions: FocusSession[],
  reviews: DailyReview[]
): MomentumData {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Today's metrics
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && (t.completedAt || t.createdAt) >= todayStart
  ).length;
  const focusToday = sessions
    .filter((s) => s.startTime >= todayStart)
    .reduce((sum, s) => sum + s.duration, 0);
  const reviewedToday = reviews.some((r) => r.createdAt >= todayStart);

  // Weekly metrics
  const completedWeek = tasks.filter(
    (t) => t.status === 'completed' && (t.completedAt || t.createdAt) >= weekAgo
  ).length;

  // Score components (each 0-25)
  const taskScore = Math.min(25, completedToday * 8);
  const focusScore = Math.min(25, (focusToday / 120) * 25);
  const reviewScore = reviewedToday ? 15 : 0;
  const consistencyScore = Math.min(35, (completedWeek / 14) * 35);

  const score = Math.round(taskScore + focusScore + reviewScore + consistencyScore);

  // Trend (compare today vs yesterday)
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const completedYesterday = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      (t.completedAt || t.createdAt) >= yesterdayStart &&
      (t.completedAt || t.createdAt) < todayStart
  ).length;

  const trend: 'up' | 'down' | 'stable' =
    completedToday > completedYesterday
      ? 'up'
      : completedToday < completedYesterday
        ? 'down'
        : 'stable';

  const label = getMomentumLabel(score);

  return { score: Math.min(100, score), trend, label };
}

function getMomentumLabel(score: number): string {
  if (score >= 80) return 'On Fire 🔥';
  if (score >= 60) return 'Strong Flow 💪';
  if (score >= 40) return 'Building Up 🌱';
  if (score >= 20) return 'Getting Started 🌅';
  return 'Fresh Start ✨';
}

// ── Weekly Insights ──────────────────────────────────────────

export function computeWeeklyInsights(
  sessions: FocusSession[],
  tasks: Task[],
  reviews: DailyReview[]
): WeeklyInsights {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekSessions = sessions.filter((s) => s.startTime >= weekAgo);
  const weekTasks = tasks.filter(
    (t) => t.status === 'completed' && (t.completedAt || t.createdAt) >= weekAgo
  );
  const weekReviews = reviews.filter((r) => r.createdAt >= weekAgo);

  return {
    bestWorkingHour: getBestWorkingHour(weekSessions),
    mostProductiveDay: getMostProductiveDay(weekTasks),
    avgFocusLength: getAvgFocusLength(weekSessions),
    weeklyEnergyTrend: weekReviews.map((r) => r.energy).reverse(),
    totalDeepWorkMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
    totalTasksCompleted: weekTasks.length,
    avgProductivity:
      weekReviews.length > 0
        ? Math.round(
            weekReviews.reduce((sum, r) => sum + r.productivity, 0) /
              weekReviews.length
          )
        : 0,
  };
}

function getBestWorkingHour(
  sessions: FocusSession[]
): WeeklyInsights['bestWorkingHour'] {
  if (sessions.length === 0) return null;

  const hourCounts: Record<number, number> = {};
  sessions.forEach((s) => {
    const hour = s.startTime.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const bestHour = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a
  )[0];

  const hour = parseInt(bestHour[0]);
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return {
    hour,
    label: `${displayHour}:00 ${amPm}`,
    sessions: bestHour[1],
  };
}

function getMostProductiveDay(
  tasks: Task[]
): WeeklyInsights['mostProductiveDay'] {
  if (tasks.length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts: Record<string, number> = {};

  tasks.forEach((t) => {
    const compDate = t.completedAt || t.createdAt;
    const day = dayNames[compDate.getDay()];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const bestDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0];

  return { day: bestDay[0], tasks: bestDay[1] };
}

function getAvgFocusLength(sessions: FocusSession[]): number {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce((sum, s) => sum + s.duration, 0);
  return Math.round(total / sessions.length);
}
