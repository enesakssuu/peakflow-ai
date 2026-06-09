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
import type { User, Task, FocusSession, DailyReview, TaskStatus, Workspace, WorkspaceMember, WorkspaceInvitation, Integration } from '@/types';

// ── Helpers ──────────────────────────────────────────────────

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (!ts) return new Date();
  const d = new Date(ts as string);
  return isNaN(d.getTime()) ? new Date() : d;
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
    username: data.username || '',
  };
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const { id, ...rest } = data as Record<string, unknown>;
  void id;
  await updateDoc(doc(db(), 'users', uid), rest);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(
    collection(db(), 'users'),
    where('username', '==', username.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    name: data.name,
    email: data.email,
    profession: data.profession || '',
    goal: data.goal || '',
    onboardingCompleted: data.onboardingCompleted || false,
    createdAt: toDate(data.createdAt),
    username: data.username || '',
  };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const q = query(
    collection(db(), 'users'),
    where('username', '==', username.toLowerCase().trim())
  );
  const snap = await getDocs(q);
  return snap.empty;
}

// ── Tasks ────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  data: { 
    title: string; 
    estimatedDuration: number; 
    impactScore: number;
    description?: string;
    imageUrl?: string;
    workspaceId?: string | null;
    assignedToUserId?: string | null;
    source?: 'local' | 'plane' | 'trello';
    sourceId?: string | null;
    status?: string;
  }
): Promise<string> {
  const ref = doc(collection(db(), 'tasks'));
  await setDoc(ref, {
    userId,
    title: data.title,
    description: data.description || '',
    imageUrl: data.imageUrl || '',
    estimatedDuration: data.estimatedDuration,
    impactScore: data.impactScore,
    status: data.status || 'todo',
    createdAt: serverTimestamp(),
    completedAt: null,
    workspaceId: data.workspaceId || null,
    assignedToUserId: data.assignedToUserId || null,
    source: data.source || 'local',
    sourceId: data.sourceId || null,
  });
  return ref.id;
}

export async function getTasks(userId: string, workspaceId: string | null = null): Promise<Task[]> {
  let q;
  if (workspaceId) {
    q = query(
      collection(db(), 'tasks'),
      where('workspaceId', '==', workspaceId)
    );
  } else {
    q = query(
      collection(db(), 'tasks'),
      where('userId', '==', userId)
    );
  }
  const snap = await getDocs(q);
  const tasks = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      estimatedDuration: data.estimatedDuration,
      impactScore: data.impactScore,
      status: data.status,
      createdAt: toDate(data.createdAt),
      completedAt: data.completedAt ? toDate(data.completedAt) : null,
      workspaceId: data.workspaceId || null,
      source: data.source || 'local',
      sourceId: data.sourceId || null,
      assignedToUserId: data.assignedToUserId || null,
      priority: data.priority || null,
      dueDate: data.dueDate ? toDate(data.dueDate) : null,
      subtasks: data.subtasks || [],
    };
  });

  // Client-side filter to prevent index issues
  const filtered = workspaceId 
    ? tasks 
    : tasks.filter((t) => !t.workspaceId);

  // Client-side sort by createdAt descending
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db(), 'tasks', taskId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    imageUrl: data.imageUrl || '',
    estimatedDuration: data.estimatedDuration,
    impactScore: data.impactScore,
    status: data.status,
    createdAt: toDate(data.createdAt),
    completedAt: data.completedAt ? toDate(data.completedAt) : null,
    workspaceId: data.workspaceId || null,
    source: data.source || 'local',
    sourceId: data.sourceId || null,
    assignedToUserId: data.assignedToUserId || null,
    priority: data.priority || null,
    dueDate: data.dueDate ? toDate(data.dueDate) : null,
    subtasks: data.subtasks || [],
  };
}

export async function updateTask(taskId: string, data: Partial<Task>): Promise<void> {
  const { id, ...rest } = data as Record<string, unknown>;
  void id;
  if (data.status === 'completed') {
    rest.completedAt = serverTimestamp();
  } else if (data.status) {
    rest.completedAt = null;
  }
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
    workspaceId: data.workspaceId || null,
  });
  return ref.id;
}

export async function getActiveFocusSession(userId: string, taskId: string): Promise<any | null> {
  const q = query(
    collection(db(), 'focusSessions'),
    where('userId', '==', userId),
    where('taskId', '==', taskId),
    where('completed', '==', false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  
  const d = snap.docs[0];
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
    workspaceId: data.workspaceId || null,
    status: data.status || 'running',
    accumulatedTime: data.accumulatedTime || 0,
    lastResumeTime: data.lastResumeTime ? toDate(data.lastResumeTime) : toDate(data.startTime),
  };
}

export async function startFocusSession(data: {
  userId: string;
  taskId: string;
  taskTitle: string;
  workspaceId: string | null;
}): Promise<string> {
  const ref = doc(collection(db(), 'focusSessions'));
  await setDoc(ref, {
    userId: data.userId,
    taskId: data.taskId,
    taskTitle: data.taskTitle,
    startTime: serverTimestamp(),
    endTime: null,
    duration: 0,
    completed: false,
    status: 'running',
    accumulatedTime: 0,
    lastResumeTime: serverTimestamp(),
    workspaceId: data.workspaceId || null,
  });
  return ref.id;
}

export async function pauseFocusSession(sessionId: string, accumulatedTime: number): Promise<void> {
  await updateDoc(doc(db(), 'focusSessions', sessionId), {
    status: 'paused',
    accumulatedTime,
  });
}

export async function resumeFocusSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db(), 'focusSessions', sessionId), {
    status: 'running',
    lastResumeTime: serverTimestamp(),
  });
}

export async function completeFocusSession(sessionId: string, elapsedSeconds: number): Promise<void> {
  await updateDoc(doc(db(), 'focusSessions', sessionId), {
    endTime: serverTimestamp(),
    completed: true,
    duration: Math.round(elapsedSeconds / 60) || 1,
    status: 'completed',
  });
}

export async function getFocusSessions(userId: string, workspaceId: string | null = null): Promise<FocusSession[]> {
  let q;
  if (workspaceId) {
    q = query(
      collection(db(), 'focusSessions'),
      where('workspaceId', '==', workspaceId)
    );
  } else {
    q = query(
      collection(db(), 'focusSessions'),
      where('userId', '==', userId)
    );
  }
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => {
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
      workspaceId: data.workspaceId || null,
    };
  });

  // Client-side filter to prevent index issues
  const filtered = workspaceId 
    ? sessions 
    : sessions.filter((s) => !s.workspaceId);

  // Client-side sort by startTime descending
  return filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
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
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const reviews = snap.docs.map((d) => {
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
  return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── Workspaces ───────────────────────────────────────────────

export async function createWorkspace(name: string, ownerId: string, ownerName: string, ownerEmail: string): Promise<string> {
  const ref = doc(collection(db(), 'workspaces'));
  const workspaceId = ref.id;
  await setDoc(ref, {
    name,
    ownerId,
    createdAt: serverTimestamp(),
  });
  // Add owner as a member
  await setDoc(doc(db(), 'workspaceMembers', `${workspaceId}_${ownerId}`), {
    workspaceId,
    userId: ownerId,
    userName: ownerName,
    userEmail: ownerEmail,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });
  return workspaceId;
}

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
  const q = query(
    collection(db(), 'workspaceMembers'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const workspaceIds = snap.docs.map((d) => d.data().workspaceId);
  
  if (workspaceIds.length === 0) return [];
  
  const workspaces: Workspace[] = [];
  // Fetch workspaces in chunks of 10 (Firestore limit for 'in' query)
  for (let i = 0; i < workspaceIds.length; i += 10) {
    const chunk = workspaceIds.slice(i, i + 10);
    const wq = query(collection(db(), 'workspaces'), where('__name__', 'in', chunk));
    const wsnap = await getDocs(wq);
    wsnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      workspaces.push({
        id: docSnap.id,
        name: data.name,
        ownerId: data.ownerId,
        createdAt: toDate(data.createdAt),
        columns: data.columns || null,
      });
    });
  }
  return workspaces;
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const q = query(
    collection(db(), 'workspaceMembers'),
    where('workspaceId', '==', workspaceId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      workspaceId: data.workspaceId,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      role: data.role,
      joinedAt: toDate(data.joinedAt),
    };
  });
}

export async function removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db(), 'workspaceMembers', `${workspaceId}_${userId}`));
}

// ── Workspace Invitations ────────────────────────────────────

export async function createInvitation(
  workspaceId: string,
  workspaceName: string,
  invitedEmail: string,
  invitedByUserId: string,
  invitedByUserName: string,
  role: 'admin' | 'member'
): Promise<string> {
  const ref = doc(collection(db(), 'workspaceInvitations'));
  await setDoc(ref, {
    workspaceId,
    workspaceName,
    invitedEmail: invitedEmail.toLowerCase().trim(),
    invitedByUserId,
    invitedByUserName,
    role,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserInvitations(email: string): Promise<WorkspaceInvitation[]> {
  const q = query(
    collection(db(), 'workspaceInvitations'),
    where('invitedEmail', '==', email.toLowerCase().trim()),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      workspaceId: data.workspaceId,
      workspaceName: data.workspaceName,
      invitedEmail: data.invitedEmail,
      invitedByUserId: data.invitedByUserId,
      invitedByUserName: data.invitedByUserName,
      role: data.role,
      status: data.status,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<WorkspaceInvitation[]> {
  const q = query(
    collection(db(), 'workspaceInvitations'),
    where('workspaceId', '==', workspaceId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      workspaceId: data.workspaceId,
      workspaceName: data.workspaceName,
      invitedEmail: data.invitedEmail,
      invitedByUserId: data.invitedByUserId,
      invitedByUserName: data.invitedByUserName,
      role: data.role,
      status: data.status,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function deleteInvitation(inviteId: string): Promise<void> {
  await deleteDoc(doc(db(), 'workspaceInvitations', inviteId));
}

export async function updateInvitationStatus(
  inviteId: string,
  status: 'accepted' | 'declined',
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  await updateDoc(doc(db(), 'workspaceInvitations', inviteId), { status });
  
  if (status === 'accepted') {
    const snap = await getDoc(doc(db(), 'workspaceInvitations', inviteId));
    if (snap.exists()) {
      const inviteData = snap.data();
      await setDoc(doc(db(), 'workspaceMembers', `${inviteData.workspaceId}_${userId}`), {
        workspaceId: inviteData.workspaceId,
        userId,
        userName,
        userEmail,
        role: inviteData.role,
        joinedAt: serverTimestamp(),
      });
    }
  }
}

// ── Integrations ─────────────────────────────────────────────

export async function saveIntegration(
  targetId: string,
  targetType: 'personal' | 'workspace',
  provider: 'plane' | 'trello',
  config: Record<string, any>
): Promise<void> {
  const q = query(
    collection(db(), 'integrations'),
    where('targetId', '==', targetId),
    where('provider', '==', provider)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docId = snap.docs[0].id;
    await updateDoc(doc(db(), 'integrations', docId), {
      config,
      isActive: true,
      lastSyncedAt: null,
    });
  } else {
    const ref = doc(collection(db(), 'integrations'));
    await setDoc(ref, {
      targetId,
      targetType,
      provider,
      config,
      isActive: true,
      lastSyncedAt: null,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getIntegrations(targetId: string): Promise<Integration[]> {
  const q = query(
    collection(db(), 'integrations'),
    where('targetId', '==', targetId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      targetId: data.targetId,
      targetType: data.targetType,
      provider: data.provider,
      config: data.config,
      isActive: data.isActive,
      lastSyncedAt: data.lastSyncedAt ? toDate(data.lastSyncedAt) : null,
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function deleteIntegration(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'integrations', id));
}

// ── Task Comments ───────────────────────────────────────────

export async function addTaskComment(
  taskId: string,
  comment: { userId: string; userName: string; content: string }
): Promise<string> {
  const ref = doc(collection(db(), 'tasks', taskId, 'comments'));
  await setDoc(ref, {
    userId: comment.userId,
    userName: comment.userName,
    content: comment.content,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTaskComments(taskId: string): Promise<any[]> {
  const q = query(collection(db(), 'tasks', taskId, 'comments'));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      userName: data.userName,
      content: data.content,
      createdAt: toDate(data.createdAt),
    };
  });
  return list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// ── Task Activities ─────────────────────────────────────────

export async function addTaskActivity(
  taskId: string,
  activity: { userId: string; userName: string; type: string; details?: any }
): Promise<string> {
  const ref = doc(collection(db(), 'tasks', taskId, 'activities'));
  await setDoc(ref, {
    userId: activity.userId,
    userName: activity.userName,
    type: activity.type,
    details: activity.details || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTaskActivities(taskId: string): Promise<any[]> {
  const q = query(collection(db(), 'tasks', taskId, 'activities'));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId,
      userName: data.userName,
      type: data.type,
      details: data.details || null,
      createdAt: toDate(data.createdAt),
    };
  });
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── Workspace Custom Columns ────────────────────────────────

export async function updateWorkspaceColumns(
  workspaceId: string,
  columns: { id: string; title: string; color: string }[]
): Promise<void> {
  await updateDoc(doc(db(), 'workspaces', workspaceId), {
    columns,
  });
}
