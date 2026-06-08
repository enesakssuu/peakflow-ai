// ============================================================
// PeakFlow AI — Focus Session Page
// ============================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getTasks, updateTask, createFocusSession } from '@/lib/firestore';
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
  const startTimeRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<Date>(new Date());

  // Load task
  useEffect(() => {
    const loadTask = async () => {
      if (!firebaseUser) return;
      const tasks = await getTasks(firebaseUser.uid);
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setTask(found);
      }
      setLoading(false);
    };
    loadTask();
  }, [firebaseUser, taskId]);

  // Timer (Timestamp-based)
  useEffect(() => {
    if (isRunning && !completed) {
      // Always reset resume point on state run to keep it accurate
      lastResumeTimeRef.current = new Date();

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
  }, [isRunning, completed]);

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
    if (!firebaseUser || !task || completed) return;

    let finalElapsed = elapsed;
    if (isRunning) {
      const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
      finalElapsed = accumulatedTimeRef.current + diffSeconds;
    }

    setCompleted(true);
    setIsRunning(false);
    setElapsed(finalElapsed);

    const endTime = new Date();
    const durationMinutes = Math.round(finalElapsed / 60);

    // Save focus session
    await createFocusSession({
      userId: firebaseUser.uid,
      taskId: task.id,
      taskTitle: task.title,
      startTime: startTimeRef.current,
      endTime,
      duration: durationMinutes || 1,
      completed: true,
    });

    // Mark task as completed
    await updateTask(task.id, { status: 'completed' });
  }, [firebaseUser, task, elapsed, isRunning, completed]);

  const handleExit = async () => {
    let finalElapsed = elapsed;
    if (isRunning && !completed) {
      const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
      finalElapsed = accumulatedTimeRef.current + diffSeconds;
    }

    if (finalElapsed > 60 && firebaseUser && task && !completed) {
      // Save partial session
      const endTime = new Date();
      const durationMinutes = Math.round(finalElapsed / 60);
      await createFocusSession({
        userId: firebaseUser.uid,
        taskId: task.id,
        taskTitle: task.title,
        startTime: startTimeRef.current,
        endTime,
        duration: durationMinutes || 1,
        completed: false,
      });
    }
    router.push('/dashboard');
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Pausing: lock in current elapsed time
      const diffSeconds = Math.floor((new Date().getTime() - lastResumeTimeRef.current.getTime()) / 1000);
      accumulatedTimeRef.current += diffSeconds;
      setElapsed(accumulatedTimeRef.current);
      setIsRunning(false);
    } else {
      // Resuming: start new timestamp interval
      lastResumeTimeRef.current = new Date();
      setIsRunning(true);
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
      <p className="text-white/30 text-sm mt-8 animate-fade-in delay-300">
        Elapsed: {formatTime(elapsed)}
      </p>
    </div>
  );
}
