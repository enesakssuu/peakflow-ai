// ============================================================
// PeakFlow AI — Recommended Task Card
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Zap, Sparkles } from 'lucide-react';
import type { TaskRecommendation } from '@/types';

interface RecommendedTaskProps {
  recommendation: TaskRecommendation | null;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getImpactLabel(score: number): string {
  if (score >= 5) return 'Critical';
  if (score >= 4) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export default function RecommendedTask({ recommendation }: RecommendedTaskProps) {
  if (!recommendation) {
    return (
      <Card className="animate-fade-in-up delay-100 border-dashed border-2">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first task to get an AI-powered recommendation.
          </p>
          <Link href="/tasks">
            <Button variant="accent">
              <Zap className="w-4 h-4 mr-1" />
              Add a Task
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { task } = recommendation;

  return (
    <div className="animate-fade-in-up delay-100">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Today&apos;s Recommended Task
      </p>
      <Card className="card-accent overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-3 leading-tight">
                {task.title}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(task.estimatedDuration)}</span>
                </div>
                <Badge className="bg-white/20 text-white border-white/20 hover:bg-white/30">
                  <Zap className="w-3 h-3 mr-1" />
                  {getImpactLabel(task.impactScore)} Impact
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/focus/${task.id}`}>
              <Button
                size="lg"
                className="bg-white text-accent hover:bg-white/90 shadow-lg font-semibold h-12 px-8"
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Start Focus Session
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
