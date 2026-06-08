// ============================================================
// PeakFlow AI — AI Reasoning Card
// ============================================================

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface AIReasoningCardProps {
  reasoning: string | null;
}

export default function AIReasoningCard({ reasoning }: AIReasoningCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!reasoning) return null;

  return (
    <div className="animate-fade-in-up delay-200">
      <Card className="border-border/60 bg-card/50">
        <CardContent className="p-4 lg:p-5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent" />
              </div>
              <span className="text-sm font-medium">AI Reasoning</span>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {expanded && (
            <div className="mt-3 pl-[42px] animate-fade-in">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {reasoning}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
