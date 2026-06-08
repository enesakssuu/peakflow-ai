// ============================================================
// PeakFlow AI — Insight Card
// ============================================================

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InsightCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  subtitle: string;
  delay?: string;
}

export default function InsightCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  subtitle,
  delay = '',
}: InsightCardProps) {
  return (
    <Card className={cn('border-border/60 animate-fade-in-up', delay)}>
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-start gap-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
