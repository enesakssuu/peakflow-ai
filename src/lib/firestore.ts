// ============================================================
// PeakFlow AI — Firestore Database Helpers
// ============================================================

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

// Lazy accessor for the Firestore instance
function db() {
  return getFirebaseDb();
}
import type { User, Task, FocusSession, DailyReview, TaskStatus } from '@/types';

// ── Helpers ──────────────────────────────────────────────────

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts as string);
}

// ── Users ────────────────────────────────────────────────────

export async function createUser(uid: string, data: Omit<User, 'id' | 'createdAt'>): Promise<void> {
  await setDoc(doc(db(), 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    email: data.email,
    profession: data.profession || '',
    goal: data.goal || '',
    onboardingCompleted: data.onboardingCompleted || false,
    createdAt: toDate(data.createdAt),
  };
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const { id, ...rest } = data as Record<string, unknown>;
  void id;
  await updateDoc(doc(db(), 'users', uid), rest);
}

// ── Tasks ────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  data: { title: string; estimatedDuration: number; impactScore: number }
): Promise<string> {
  const ref = doc(collection(db(), 'tasks'));
  await setDoc(ref, {
    userId,
    title: data.title,
    estimatedDuration: data.estimatedDuration,
    impactScore: data.impactScore,
    status: 'todo' as TaskStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTasks(userId: string): Promise<Task[]> {
  const q = query(
    collection(db(), 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      title: data.title,
      estimatedDuration: data.estimatedDuration,
      impactScore: data.impactScore,
      status: data.status as TaskStatus,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  const { id, ...rest } = data as Record<string, unknown>;
  void id;
  await updateDoc(doc(db(), 'tasks', taskId), rest);
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db(), 'tasks', taskId));
}

// ── Focus Sessions ───────────────────────────────────────────

export async function createFocusSession(
  data: Omit<FocusSession, 'id'>
): Promise<string> {
  const ref = doc(collection(db(), 'focusSessions'));
  await setDoc(ref, {
    userId: data.userId,
    taskId: data.taskId,
    taskTitle: data.taskTitle,
    startTime: Timestamp.fromDate(data.startTime instanceof Date ? data.startTime : new Date(data.startTime)),
    endTime: data.endTime ? Timestamp.fromDate(data.endTime instanceof Date ? data.endTime : new Date(data.endTime)) : null,
    duration: data.duration,
    completed: data.completed,
  });
  return ref.id;
}

export async function getFocusSessions(userId: string): Promise<FocusSession[]> {
  const q = query(
    collection(db(), 'focusSessions'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      startTime: toDate(data.startTime),
      endTime: data.endTime ? toDate(data.endTime) : null,
      duration: data.duration,
      completed: data.completed,
    };
  });
}

// ── Daily Reviews ────────────────────────────────────────────

export async function createDailyReview(
  data: Omit<DailyReview, 'id' | 'createdAt'>
): Promise<string> {
  const ref = doc(collection(db(), 'dailyReviews'));
  await setDoc(ref, {
    userId: data.userId,
    energy: data.energy,
    productivity: data.productivity,
    win: data.win,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDailyReviews(userId: string): Promise<DailyReview[]> {
  const q = query(
    collection(db(), 'dailyReviews'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      energy: data.energy,
      productivity: data.productivity,
      win: data.win,
      createdAt: toDate(data.createdAt),
    };
  });
}
