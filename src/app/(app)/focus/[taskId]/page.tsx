// ============================================================
// PeakFlow AI — Focus Session Page
// ============================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  getTask, 
  updateTask, 
  getActiveFocusSession, 
  startFocusSession, 
  pauseFocusSession, 
  resumeFocusSession, 
  completeFocusSession 
} from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Pause, Play, CheckCircle2, X, Zap } from 'lucide-react';
import type { Task } from '@/types';

export default function FocusPage() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<Date>(new Date());

  // Load task and active focus session
  useEffect(() => {
    const loadData = async () => {
      if (!firebaseUser) return;
      
      try {
        const foundTask = await getTask(taskId);
        if (!foundTask) {
          setLoading(false);
          return;
        }
        setTask(foundTask);

        // Check if there is an active focus session in Firestore
        const activeSession = await getActiveFocusSession(firebaseUser.uid, taskId);
        
        if (activeSession) {
          setActiveSessionId(activeSession.id);
          const accumulated = activeSession.accumulatedTime || 0;
          accumulatedTimeRef.current = accumulated;

          if (activeSession.status === 'running') {
            setIsRunning(true);
            const lastResume = activeSession.lastResumeTime || activeSession.startTime;
            lastResumeTimeRef.current = lastResume;
            
            const diffSeconds = Math.floor((new Date().getTime() - lastResume.getTime()) / 1000);
            setElapsed(accumulated + diffSeconds);
          } else {
            setIsRunning(false);
            setElapsed(accumulated);
          }
        } else {
          // No active session exists: create one in Firestore immediately
          const newSessionId = await startFocusSession({
            userId: firebaseUser.uid,
            taskId: taskId,
            taskTitle: foundTask.title,
            workspaceId: foundTask.workspaceId || null,
          });
          setActiveSessionId(newSessionId);
          setIsRunning(true);
          lastResumeTimeRef.current = new Date();
          accumulatedTimeRef.current = 0;
          setElapsed(0);
        }
      } catch (err) {
        console.error('Error loading focus page data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [firebaseUser, taskId]);

  // Timer interval loop (Ticking from lastResumeTime to prevent tab freeze issue)
  useEffect(() => {
    if (isRunning && !completed && activeSessionId) {
      const tick = () => {
        const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
        setElapsed(accumulatedTimeRef.current + diffSeconds);
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, completed, activeSessionId]);

  // Listen to visibility and focus events to catch up instantly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && !completed) {
        const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
        setElapsed(accumulatedTimeRef.current + diffSeconds);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isRunning, completed]);

  const totalSeconds = task ? task.estimatedDuration * 60 : 0;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? Math.min(1, elapsed / totalSeconds) : 0;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(async () => {
    if (!firebaseUser || !task || completed || !activeSessionId) return;

    let finalElapsed = elapsed;
    if (isRunning) {
      const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
      finalElapsed = accumulatedTimeRef.current + diffSeconds;
    }

    setCompleted(true);
    setIsRunning(false);
    setElapsed(finalElapsed);

    try {
      // Mark focus session as completed in Firestore
      await completeFocusSession(activeSessionId, finalElapsed);

      // Mark task as completed
      await updateTask(task.id, { status: 'completed' });
    } catch (err) {
      console.error('Error completing focus session:', err);
    }
  }, [firebaseUser, task, elapsed, isRunning, completed, activeSessionId]);

  const handleExit = () => {
    // Just exit! Timer remains active in Firestore and continues running in the background.
    router.push('/dashboard');
  };

  const toggleTimer = async () => {
    if (!activeSessionId) return;

    try {
      if (isRunning) {
        // Pausing: lock in current elapsed time
        const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
        const newAccumulated = accumulatedTimeRef.current + diffSeconds;
        accumulatedTimeRef.current = newAccumulated;
        setElapsed(newAccumulated);
        setIsRunning(false);

        // Save paused state in Firestore
        await pauseFocusSession(activeSessionId, newAccumulated);
      } else {
        // Resuming: start new timestamp interval
        lastResumeTimeRef.current = new Date();
        setIsRunning(true);

        // Save resume state in Firestore
        await resumeFocusSession(activeSessionId);
      }
    } catch (err) {
      console.error('Error toggling focus timer:', err);
    }
  };

  // SVG timer ring
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  if (loading) {
    return (
      <div className="focus-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="focus-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Task not found</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-bg flex flex-col items-center justify-center px-4 relative">
      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
        title="Exit focus (keeps running in background)"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {/* Completed overlay */}
      {completed && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Well Done!</h2>
            <p className="text-white/60 mb-2">
              You focused for {formatTime(elapsed)}
            </p>
            <p className="text-white/40 text-sm mb-8">
              &quot;{task.title}&quot; is now complete.
            </p>
            <Button
              size="lg"
              className="bg-accent text-white hover:bg-accent/90"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Task title */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent uppercase tracking-wider">
            Focus Session
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white max-w-lg">
          {task.title}
        </h1>
        {task.description && (
          <p className="text-white/60 text-xs mt-2.5 max-w-md mx-auto line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Timer ring */}
      <div className="relative w-72 h-72 lg:w-80 lg:h-80 mb-10 animate-scale-in">
        <svg className="w-full h-full" viewBox="0 0 300 300">
          {/* Track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            fill="none"
            stroke="#14B8A6"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-6xl lg:text-7xl font-bold text-white font-mono tracking-tighter">
            {formatTime(remaining)}
          </p>
          <p className="text-white/40 text-sm mt-2">
            {remaining > 0 ? 'remaining' : 'overtime'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 animate-fade-in-up delay-200">
        <Button
          size="xl"
          variant={isRunning ? 'ghost' : 'accent'}
          className={
            isRunning
              ? 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white w-40'
              : 'w-40'
          }
          onClick={toggleTimer}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2 fill-current" />
              Resume
            </>
          )}
        </Button>

        <Button
          size="xl"
          className="bg-success hover:bg-success/90 text-white w-40"
          onClick={handleComplete}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Complete
        </Button>
      </div>

      {/* Elapsed time */}
      <p className="text-white/30 text-sm mt-8 animate-fade-in delay-300 animate-pulse-soft">
        Active Session Running... Elapsed: {formatTime(elapsed)}
      </p>
    </div>
  );
}
