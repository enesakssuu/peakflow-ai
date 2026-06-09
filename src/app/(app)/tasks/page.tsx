// ============================================================
// PeakFlow AI — Tasks Page
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/firestore';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, ListTodo, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

type FilterType = 'all' | 'active' | 'completed';

export default function TasksPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const loadTasks = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const data = await getTasks(firebaseUser.uid, currentWorkspaceId === 'personal' ? null : currentWorkspaceId);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, currentWorkspaceId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSave = async (data: { 
    title: string; 
    estimatedDuration: number; 
    impactScore: number;
    description?: string;
    imageUrl?: string;
  }) => {
    if (!firebaseUser) return;

    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(firebaseUser.uid, {
        ...data,
        workspaceId: currentWorkspaceId === 'personal' ? null : currentWorkspaceId,
      });
    }
    setEditingTask(null);
    await loadTasks();
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
    await loadTasks();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    await loadTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'active', label: 'Active', count: tasks.filter((t) => t.status !== 'completed').length },
    { id: 'completed', label: 'Completed', count: tasks.filter((t) => t.status === 'completed').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tasks.filter((t) => t.status !== 'completed').length} active tasks
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
          id="add-task-btn"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
              filter === f.id
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <ListTodo className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No tasks here</h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'completed'
              ? "You haven't completed any tasks yet."
              : 'Add your first task to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSave}
      />
    </div>
  );
}
