// ============================================================
// PeakFlow AI — Task Card
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Zap,
  Play,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const isCompleted = task.status === 'completed';

  const statusIcon = {
    backlog: <FolderOpen className="w-5 h-5 text-muted-foreground/60 hover:text-accent transition-colors" />,
    todo: <Circle className="w-5 h-5 text-muted-foreground hover:text-accent transition-colors" />,
    in_progress: <Loader2 className="w-5 h-5 text-accent animate-spin" />,
    completed: <CheckCircle2 className="w-5 h-5 text-success" />,
  };

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    backlog: 'todo',
    todo: 'in_progress',
    in_progress: 'completed',
    completed: 'backlog',
  };

  return (
    <Card
      className={cn(
        'border-border/60 transition-all duration-200 hover:shadow-md group bg-card',
        isCompleted && 'opacity-65'
      )}
    >
      <CardContent className="p-4 flex items-start gap-3.5">
        {/* Status toggle */}
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className="flex-shrink-0 cursor-pointer mt-0.5"
          title={`Status: ${task.status.replace('_', ' ')}`}
        >
          {statusIcon[task.status]}
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-semibold text-foreground truncate',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">
              {task.description}
            </p>
          )}

          {task.imageUrl && (
            <div className="mt-2.5 rounded-lg overflow-hidden border border-border/55 bg-secondary/15 max-w-[150px] aspect-video">
              <img src={task.imageUrl} alt="Attached Visual" className="object-cover w-full h-full" />
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5 font-medium">
              <Clock className="w-3 h-3 text-muted-foreground/70" />
              {formatDuration(task.estimatedDuration)}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5 font-semibold">
              <Zap className="w-2.5 h-2.5 mr-0.5 text-warning fill-warning" />
              Impact: {task.impactScore}
            </Badge>
            {task.status === 'backlog' && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4.5 border-dashed uppercase text-muted-foreground">
                Backlog
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-start">
          {!isCompleted && (
            <Link href={`/focus/${task.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10" title="Start Focus">
                <Play className="w-3.5 h-3.5 fill-current text-accent" />
              </Button>
            </Link>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px] animate-scale-in">
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-secondary cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-secondary text-destructive cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
