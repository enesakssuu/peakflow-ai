// ============================================================
// PeakFlow AI — Task Dialog (Create/Edit)
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Clock, Zap } from 'lucide-react';
import type { Task } from '@/types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (data: { title: string; estimatedDuration: number; impactScore: number }) => void;
}

const durations = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

export default function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [impact, setImpact] = useState(3);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDuration(task.estimatedDuration);
      setImpact(task.impactScore);
    } else {
      setTitle('');
      setDuration(30);
      setImpact(3);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      estimatedDuration: Math.max(1, duration),
      impactScore: impact,
    });
    onOpenChange(false);
  };

  const impactLabels: Record<number, string> = {
    1: 'Low',
    2: 'Medium-Low',
    3: 'Medium',
    4: 'High',
    5: 'Critical',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details.' : 'What do you need to get done?'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Task</Label>
            <Input
              id="task-title"
              placeholder="e.g., Write blog post about AI productivity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="h-11"
            />
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Estimated Duration
              </span>
              <span className="text-xs text-accent font-semibold">
                {duration > 0 ? `${duration} min` : 'Not set'}
              </span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    duration === d.value
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border hover:border-accent/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-4 border-t border-border/40 pt-2.5">
              <span className="text-xs font-medium text-muted-foreground">Or set custom minutes:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={480}
                  value={duration || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDuration(0);
                    } else {
                      const num = parseInt(val);
                      setDuration(isNaN(num) ? 0 : num);
                    }
                  }}
                  className="w-24 h-9 text-sm text-center font-medium"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Impact Score */}
          <div className="space-y-3">
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                Impact Score
              </span>
              <span className="text-xs text-accent font-medium">
                {impact}/5 — {impactLabels[impact]}
              </span>
            </Label>
            <Slider
              value={[impact]}
              onValueChange={(val) => setImpact(val[0])}
              min={1}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>Low</span>
              <span>Critical</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={!title.trim()}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
