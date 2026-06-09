// ============================================================
// PeakFlow AI — Team Workspace Dashboard
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getTasks, getFocusSessions, updateTask, createTask, deleteTask } from '@/lib/firestore';
import { calculateMomentumScore } from '@/lib/ai-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import TaskDialog from '@/components/tasks/TaskDialog';
import {
  Users,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  User,
  Activity,
  Flame,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  FolderOpen,
  Layers,
  ArrowRight,
  UserCheck,
  MoreVertical,
  Trash2,
  Pencil
} from 'lucide-react';
import type { Task, FocusSession, MomentumData, TaskStatus } from '@/types';

type VisibleColumns = Record<TaskStatus, boolean>;

export default function TeamDashboardPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId, activeWorkspace, members } = useWorkspace();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSessions, setActiveSessions] = useState<FocusSession[]>([]);
  const [momentum, setMomentum] = useState<MomentumData>({
    score: 0,
    trend: 'stable',
    label: 'Fresh Start ✨',
  });
  const [loading, setLoading] = useState(true);

  // Column Visibility state (persisted in localStorage)
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    backlog: true,
    todo: true,
    in_progress: true,
    completed: true,
  });

  // Task Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('todo');

  // Load column visibility preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('peakflow_team_columns');
      if (saved) {
        try {
          setVisibleColumns(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing visible columns:', e);
        }
      }
    }
  }, []);

  const toggleColumnVisibility = (col: TaskStatus) => {
    const updated = { ...visibleColumns, [col]: !visibleColumns[col] };
    setVisibleColumns(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peakflow_team_columns', JSON.stringify(updated));
    }
  };

  const loadTeamDashboardData = useCallback(async () => {
    if (!firebaseUser || currentWorkspaceId === 'personal') {
      setLoading(false);
      return;
    }

    try {
      const db = getFirebaseDb();

      // 1. Fetch workspace tasks & sessions
      const [wTasks, wSessions] = await Promise.all([
        getTasks(firebaseUser.uid, currentWorkspaceId),
        getFocusSessions(firebaseUser.uid, currentWorkspaceId),
      ]);
      setTasks(wTasks);

      // 2. Compute workspace momentum
      const mom = calculateMomentumScore(wTasks, wSessions, []);
      setMomentum(mom);

      // 3. Get active focus sessions for this workspace (where endTime === null)
      const activeList = wSessions.filter((s) => s.endTime === null);

      // Filter out sessions older than 3 hours to prevent stale active state
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const activeValid = activeList.filter((s) => s.startTime > threeHoursAgo);
      setActiveSessions(activeValid);

    } catch (err) {
      console.error('Error loading team dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, currentWorkspaceId]);

  useEffect(() => {
    loadTeamDashboardData();
    // Poll active sessions every 30 seconds for live updates
    const interval = setInterval(loadTeamDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadTeamDashboardData]);

  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      await updateTask(taskId, { assignedToUserId: userId || null });
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleOpenAddTaskDialog = (status: TaskStatus) => {
    setTargetColumnStatus(status);
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        await loadTeamDashboardData();
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleSaveTask = async (data: {
    title: string;
    estimatedDuration: number;
    impactScore: number;
    description?: string;
    imageUrl?: string;
  }) => {
    if (!firebaseUser) return;

    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
      } else {
        await createTask(firebaseUser.uid, {
          ...data,
          status: targetColumnStatus,
          workspaceId: currentWorkspaceId,
        } as any);
      }
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  if (currentWorkspaceId === 'personal') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Users className="w-16 h-16 text-muted-foreground/60 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-foreground">Switch to a Team Workspace</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Team Dashboard is only accessible when inside a Team Workspace. Use the switcher at the top of the sidebar to switch.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Kanban Columns configuration
  const columnsList: { id: TaskStatus; title: string; colorClass: string; bgClass: string; icon: any }[] = [
    {
      id: 'backlog',
      title: 'Backlog',
      colorClass: 'text-muted-foreground border-muted-foreground/30',
      bgClass: 'bg-secondary/15',
      icon: <FolderOpen className="w-4 h-4 text-muted-foreground/75" />,
    },
    {
      id: 'todo',
      title: 'Todo',
      colorClass: 'text-info border-info/30',
      bgClass: 'bg-info/5',
      icon: <Layers className="w-4 h-4 text-info/80" />,
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      colorClass: 'text-accent border-accent/30',
      bgClass: 'bg-accent/5',
      icon: <Activity className="w-4 h-4 text-accent/80" />,
    },
    {
      id: 'completed',
      title: 'Done',
      colorClass: 'text-success border-success/30',
      bgClass: 'bg-success/5',
      icon: <CheckCircle2 className="w-4 h-4 text-success/80" />,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            Team Workspace Board
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {activeWorkspace?.name}
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Momentum Stats */}
          <div className="flex items-center gap-3 bg-secondary/50 rounded-2xl px-4 py-2 border border-border/40 w-fit">
            <Flame className="w-5 h-5 text-warning animate-pulse-soft" />
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Workspace Momentum
              </p>
              <p className="text-sm font-bold text-foreground">
                {momentum.score}/100 — {momentum.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing Live Standings at 100% width */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/50">
          <CardHeader className="py-4 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Live Workspace Standings ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => {
                const activeSession = activeSessions.find((s) => s.userId === member.userId);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-secondary/10 hover:bg-secondary/20 transition-all">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-sm font-bold text-accent">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                        activeSession ? 'bg-success animate-pulse' : 'bg-muted-foreground/45'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {member.userName}
                      </p>
                      {activeSession ? (
                        <span className="text-[10px] text-success font-semibold flex items-center gap-1 mt-0.5 animate-pulse-soft truncate">
                          Focusing: &quot;{activeSession.taskTitle}&quot;
                        </span>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Idle
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Column Configurator */}
      <div className="flex flex-col gap-3.5 bg-secondary/35 border border-border/40 rounded-2xl p-4">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Configure Kanban Columns
        </span>
        <div className="flex flex-wrap gap-2.5">
          {columnsList.map((col) => {
            const isVisible = visibleColumns[col.id];
            return (
              <button
                key={col.id}
                onClick={() => toggleColumnVisibility(col.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isVisible
                    ? 'border-accent bg-accent/10 text-accent shadow-sm'
                    : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {col.title}
                <Badge variant="secondary" className="ml-1 text-[10px] py-0 px-1.5 h-4.5 bg-background/50">
                  {tasks.filter((t) => t.status === col.id).length}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Board Row */}
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin">
        {columnsList
          .filter((col) => visibleColumns[col.id])
          .map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-80 rounded-2xl border border-border/50 p-4 flex flex-col max-h-[70vh] min-h-[450px] ${col.bgClass}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
                      {col.title}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-background border border-border/20">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenAddTaskDialog(col.id)}
                    title={`Add task to ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Column Cards Stack */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl p-4 bg-background/20">
                      Empty column. Click + to add.
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const assignee = members.find((m) => m.userId === task.assignedToUserId);
                      const isAssignedToMe = task.assignedToUserId === firebaseUser?.uid;

                      return (
                        <div
                          key={task.id}
                          className="bg-card border border-border/60 hover:border-border rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3 relative"
                        >
                          {/* Options dropdown menu */}
                          <div className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 hover:bg-secondary"
                              onClick={() => handleEditTask(task)}
                              title="Edit Task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-destructive hover:bg-destructive/5"
                              onClick={() => handleDeleteTask(task.id)}
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Task Content */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-[90%]">
                              <span className="font-bold text-xs text-foreground leading-snug">
                                {task.title}
                              </span>
                              {task.source && task.source !== 'local' && (
                                <Badge variant="outline" className="text-[8px] uppercase tracking-wider h-4 py-0 px-1">
                                  {task.source}
                                </Badge>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[10px] text-muted-foreground leading-normal whitespace-pre-line line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}

                            {task.imageUrl && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-border/40 aspect-video max-h-24 bg-secondary/15">
                                <img src={task.imageUrl} alt="Attached" className="object-cover w-full h-full" />
                              </div>
                            )}
                          </div>

                          {/* Task Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[9px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5 font-medium">
                              <Clock className="w-2.5 h-2.5" />
                              {task.estimatedDuration}m
                            </span>
                            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5 font-medium">
                              <Zap className="w-2.5 h-2.5 text-warning fill-warning" />
                              {task.impactScore}/5
                            </span>
                          </div>

                          <div className="border-t border-border/40 pt-2.5 flex flex-col gap-2">
                            {/* Assignee Selection */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                Assignee
                              </span>
                              <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-lg px-2 py-0.5 text-[10px]">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <select
                                  value={task.assignedToUserId || ''}
                                  onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                                  className="bg-transparent font-medium text-foreground outline-none text-[10px] cursor-pointer max-w-[100px]"
                                >
                                  <option value="">Unassigned</option>
                                  {members.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                      {m.userName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Status and Action Buttons */}
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Status
                                </span>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                  className="bg-transparent text-[10px] font-bold text-accent outline-none cursor-pointer max-w-[90px] border border-border/30 rounded px-1.5 py-0.5"
                                >
                                  <option value="backlog">Backlog</option>
                                  <option value="todo">Todo</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Done</option>
                                </select>
                              </div>

                              {/* Focus/Claim trigger */}
                              {task.status !== 'completed' && (
                                isAssignedToMe ? (
                                  <Button
                                    size="sm"
                                    className="bg-accent text-white hover:bg-accent/90 h-6 px-2 text-[10px] rounded-lg shrink-0"
                                    onClick={() => router.push(`/focus/${task.id}`)}
                                  >
                                    <Play className="w-2.5 h-2.5 mr-1 fill-current" />
                                    Focus
                                  </Button>
                                ) : (
                                  task.assignedToUserId === null && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="hover:border-accent hover:text-accent h-6 px-2 text-[10px] rounded-lg shrink-0"
                                      onClick={() => handleAssignTask(task.id, firebaseUser?.uid || null)}
                                    >
                                      <UserCheck className="w-2.5 h-2.5 mr-1" />
                                      Claim
                                    </Button>
                                  )
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Task Creation & Editing Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
}
