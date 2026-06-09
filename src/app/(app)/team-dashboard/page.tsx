// ============================================================
// PeakFlow AI — Team Workspace Dashboard
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { getTasks, getFocusSessions, updateTask } from '@/lib/firestore';
import { calculateMomentumScore } from '@/lib/ai-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import {
  Users,
  Zap,
  Play,
  CheckCircle,
  Clock,
  User,
  Activity,
  Flame,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import type { Task, FocusSession, MomentumData } from '@/types';

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

      // 3. Fetch active focus sessions for this workspace (where endTime == null)
      const q = query(
        collection(db, 'focusSessions'),
        where('workspaceId', '==', currentWorkspaceId),
        where('endTime', '==', null)
      );
      const snap = await getDocs(q);
      const activeList = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          startTime: data.startTime.toDate(),
          endTime: null,
          duration: data.duration,
          completed: data.completed,
          workspaceId: data.workspaceId,
        };
      });

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

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

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

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            Team Space
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {activeWorkspace?.name}
          </h1>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Member Standings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-accent" />
                Live Standings ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              {members.map((member) => {
                const activeSession = activeSessions.find((s) => s.userId === member.userId);
                return (
                  <div key={member.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                        activeSession ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.userName}
                      </p>
                      {activeSession ? (
                        <p className="text-xs text-success font-medium truncate mt-0.5 animate-pulse-soft">
                          Focusing: &quot;{activeSession.taskTitle}&quot;
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          Idle
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Shared Tasks Board */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-accent" />
                Active Tasks ({activeTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeTasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No active tasks in this workspace. Pull from Integrations or create tasks inside the Tasks tab!
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {activeTasks.map((task) => {
                    const assignee = members.find((m) => m.userId === task.assignedToUserId);
                    const isAssignedToMe = task.assignedToUserId === firebaseUser?.uid;

                    return (
                      <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-all">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate block max-w-sm sm:max-w-md">
                              {task.title}
                            </span>
                            {task.source && task.source !== 'local' && (
                              <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider h-5 shrink-0">
                                {task.source}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {task.estimatedDuration}m
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-warning" />
                              Impact: {task.impactScore}/5
                            </span>
                          </div>
                        </div>

                        {/* Assignee & Start Action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 bg-secondary/40 border border-border/40 rounded-xl px-2.5 py-1 text-xs">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <select
                              value={task.assignedToUserId || ''}
                              onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                              className="bg-transparent font-medium text-foreground outline-none text-xs cursor-pointer max-w-[120px]"
                            >
                              <option value="">Unassigned</option>
                              {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.userName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {isAssignedToMe ? (
                            <Button
                              size="sm"
                              className="bg-accent text-white hover:bg-accent/90 shrink-0"
                              onClick={() => router.push(`/focus/${task.id}`)}
                            >
                              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                              Focus
                            </Button>
                          ) : (
                            task.assignedToUserId === null && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:border-accent hover:text-accent shrink-0"
                                onClick={() => handleAssignTask(task.id, firebaseUser?.uid || null)}
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                Claim
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks section */}
          {completedTasks.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Completed Tasks ({completedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
                  {completedTasks.map((task) => {
                    const assignee = members.find((m) => m.userId === task.assignedToUserId);
                    return (
                      <div key={task.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground line-through truncate max-w-sm">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 bg-secondary/50 rounded-full px-2 py-0.5">
                          Done {assignee ? `by ${assignee.userName}` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
