// ============================================================
// PeakFlow AI — Today's Stats
// ============================================================

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, Flame } from 'lucide-react';

interface TodayStatsProps {
  completedTasks: number;
  deepWorkMinutes: number;
  streakDays: number;
}

export default function TodayStats({
  completedTasks,
  deepWorkMinutes,
  streakDays,
}: TodayStatsProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const stats = [
    {
      label: 'Completed',
      value: completedTasks.toString(),
      subtitle: 'tasks today',
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Deep Work',
      value: formatTime(deepWorkMinutes),
      subtitle: 'focused time',
      icon: Clock,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Streak',
      value: streakDays.toString(),
      subtitle: streakDays === 1 ? 'day' : 'days',
      icon: Flame,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="animate-fade-in-up delay-400">
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4 lg:p-5 text-center">
              <div
                className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2.5`}
              >
                <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
