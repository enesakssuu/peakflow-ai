// ============================================================
// PeakFlow AI — Momentum Score
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MomentumData } from '@/types';

interface MomentumScoreProps {
  data: MomentumData;
}

export default function MomentumScore({ data }: MomentumScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = data.score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= data.score) {
        setAnimatedScore(data.score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [data.score]);

  // SVG circle params
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const TrendIcon =
    data.trend === 'up'
      ? TrendingUp
      : data.trend === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    data.trend === 'up'
      ? 'text-success'
      : data.trend === 'down'
        ? 'text-warning'
        : 'text-muted-foreground';

  return (
    <div className="animate-fade-in-up delay-300">
      <Card className="border-border/60">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-center gap-5">
            {/* Momentum Ring */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="momentum-ring w-24 h-24" viewBox="0 0 100 100">
                <circle className="track" cx="50" cy="50" r={radius} />
                <circle
                  className="progress"
                  cx="50"
                  cy="50"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{animatedScore}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Momentum
              </p>
              <p className="text-lg font-semibold">{data.label}</p>
              <div className={`flex items-center gap-1 mt-1 ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {data.trend === 'up'
                    ? 'Trending up'
                    : data.trend === 'down'
                      ? 'Trending down'
                      : 'Holding steady'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
