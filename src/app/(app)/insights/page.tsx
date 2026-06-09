// ============================================================
// PeakFlow AI — Weekly Insights Page
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getTasks, getFocusSessions, getDailyReviews } from '@/lib/firestore';
import { computeWeeklyInsights } from '@/lib/ai-engine';
import InsightCard from '@/components/insights/InsightCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  CheckCircle2,
  Brain,
  Battery,
} from 'lucide-react';
import type { WeeklyInsights } from '@/types';

export default function InsightsPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const workspaceScope = currentWorkspaceId === 'personal' ? null : currentWorkspaceId;
      const [tasks, sessions, reviews] = await Promise.all([
        getTasks(firebaseUser.uid, workspaceScope),
        getFocusSessions(firebaseUser.uid, workspaceScope),
        getDailyReviews(firebaseUser.uid),
      ]);

      const data = computeWeeklyInsights(sessions, tasks, reviews);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, currentWorkspaceId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = insights && (
    insights.totalTasksCompleted > 0 ||
    insights.totalDeepWorkMinutes > 0 ||
    insights.weeklyEnergyTrend.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Weekly Insights</h1>
            <p className="text-muted-foreground text-sm">
              Your productivity patterns from the last 7 days.
            </p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <Card className="animate-fade-in-up">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Brain className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Not enough data yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Complete some tasks and focus sessions to see your weekly insights.
              Keep going — your patterns will appear here soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InsightCard
              icon={Clock}
              iconColor="text-accent"
              iconBg="bg-accent/10"
              title="Best Working Hour"
              value={insights.bestWorkingHour?.label || 'N/A'}
              subtitle={
                insights.bestWorkingHour
                  ? `${insights.bestWorkingHour.sessions} sessions at this time`
                  : 'No sessions yet'
              }
              delay="delay-100"
            />

            <InsightCard
              icon={Calendar}
              iconColor="text-success"
              iconBg="bg-success/10"
              title="Most Productive Day"
              value={insights.mostProductiveDay?.day || 'N/A'}
              subtitle={
                insights.mostProductiveDay
                  ? `${insights.mostProductiveDay.tasks} tasks completed`
                  : 'No completed tasks'
              }
              delay="delay-200"
            />

            <InsightCard
              icon={Zap}
              iconColor="text-warning"
              iconBg="bg-warning/10"
              title="Avg Focus Length"
              value={insights.avgFocusLength > 0 ? formatMinutes(insights.avgFocusLength) : 'N/A'}
              subtitle="per session"
              delay="delay-300"
            />

            <InsightCard
              icon={TrendingUp}
              iconColor="text-accent"
              iconBg="bg-accent/10"
              title="Total Deep Work"
              value={formatMinutes(insights.totalDeepWorkMinutes)}
              subtitle="this week"
              delay="delay-400"
            />

            <InsightCard
              icon={CheckCircle2}
              iconColor="text-success"
              iconBg="bg-success/10"
              title="Tasks Completed"
              value={insights.totalTasksCompleted.toString()}
              subtitle="this week"
              delay="delay-500"
            />

            <InsightCard
              icon={Battery}
              iconColor="text-warning"
              iconBg="bg-warning/10"
              title="Avg Productivity"
              value={insights.avgProductivity > 0 ? `${insights.avgProductivity}/10` : 'N/A'}
              subtitle="self-reported"
              delay="delay-500"
            />
          </div>

          {/* Energy trend */}
          {insights.weeklyEnergyTrend.length > 0 && (
            <Card className="animate-fade-in-up delay-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Battery className="w-4 h-4 text-accent" />
                  Energy Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-24">
                  {insights.weeklyEnergyTrend.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{val}</span>
                      <div
                        className="w-full bg-accent/20 rounded-t-md transition-all duration-500"
                        style={{
                          height: `${(val / 10) * 100}%`,
                          minHeight: '4px',
                        }}
                      >
                        <div
                          className="w-full h-full bg-accent rounded-t-md"
                          style={{ opacity: 0.3 + (val / 10) * 0.7 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Last {insights.weeklyEnergyTrend.length} daily check-ins
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
