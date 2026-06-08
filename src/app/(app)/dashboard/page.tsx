// ============================================================
// PeakFlow AI — Dashboard Page
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTasks, getFocusSessions, getDailyReviews } from '@/lib/firestore';
import { getRecommendedTask, calculateMomentumScore, buildUserContext } from '@/lib/ai-engine';
import GreetingHeader from '@/components/dashboard/GreetingHeader';
import RecommendedTask from '@/components/dashboard/RecommendedTask';
import AIReasoningCard from '@/components/dashboard/AIReasoningCard';
import MomentumScore from '@/components/dashboard/MomentumScore';
import TodayStats from '@/components/dashboard/TodayStats';
import type { Task, FocusSession, DailyReview, TaskRecommendation, MomentumData } from '@/types';

export default function DashboardPage() {
  const { firebaseUser, userData } = useAuth();
  const [recommendation, setRecommendation] = useState<TaskRecommendation | null>(null);
  const [momentum, setMomentum] = useState<MomentumData>({
    score: 0,
    trend: 'stable',
    label: 'Fresh Start ✨',
  });
  const [completedToday, setCompletedToday] = useState(0);
  const [deepWorkToday, setDeepWorkToday] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const [tasks, sessions, reviews] = await Promise.all([
        getTasks(firebaseUser.uid),
        getFocusSessions(firebaseUser.uid),
        getDailyReviews(firebaseUser.uid),
      ]);

      // Get recommendation
      const rec = getRecommendedTask(tasks, sessions, reviews);
      setRecommendation(rec);

      // Calculate momentum
      const mom = calculateMomentumScore(tasks, sessions, reviews);
      setMomentum(mom);

      // Today's stats
      const context = buildUserContext(tasks, sessions, reviews);
      setCompletedToday(context.completedToday);
      setDeepWorkToday(context.totalFocusToday);
      setStreakDays(context.streakDays);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GreetingHeader name={userData?.name || 'User'} />

      <RecommendedTask recommendation={recommendation} />

      <AIReasoningCard reasoning={recommendation?.reasoning || null} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <MomentumScore data={momentum} />
        <div />
      </div>

      <TodayStats
        completedTasks={completedToday}
        deepWorkMinutes={deepWorkToday}
        streakDays={streakDays}
      />
    </div>
  );
}
