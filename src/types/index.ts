// ============================================================
// PeakFlow AI — Core Type Definitions
// ============================================================

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  profession: string;
  goal: string;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  estimatedDuration: number; // in minutes
  impactScore: number;       // 1-5
  status: TaskStatus;
  createdAt: Date;
  completedAt?: Date | null;
  workspaceId?: string | null;
  source?: 'local' | 'plane' | 'trello';
  sourceId?: string | null;
  assignedToUserId?: string | null;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in minutes
  completed: boolean;
  workspaceId?: string | null;
}

export interface DailyReview {
  id: string;
  userId: string;
  energy: number;       // 1-10
  productivity: number; // 1-10
  win: string;
  createdAt: Date;
  workspaceId?: string | null;
}

// AI Engine Types
export interface TaskRecommendation {
  task: Task;
  score: number;
  reasoning: string;
}

export interface UserContext {
  currentHour: number;
  completedToday: number;
  totalFocusToday: number;     // minutes
  recentEnergy: number | null;  // from last daily review
  streakDays: number;
}

export interface WeeklyInsights {
  bestWorkingHour: { hour: number; label: string; sessions: number } | null;
  mostProductiveDay: { day: string; tasks: number } | null;
  avgFocusLength: number; // minutes
  weeklyEnergyTrend: number[];
  totalDeepWorkMinutes: number;
  totalTasksCompleted: number;
  avgProductivity: number;
}

export interface MomentumData {
  score: number;       // 0-100
  trend: 'up' | 'down' | 'stable';
  label: string;
}

// Team Workspace Types
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export interface WorkspaceMember {
  id: string; // workspaceId_userId
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedEmail: string;
  invitedByUserId: string;
  invitedByUserName: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

export interface Integration {
  id: string;
  targetId: string; // userId or workspaceId
  targetType: 'personal' | 'workspace';
  provider: 'plane' | 'trello';
  config: {
    // Plane config
    apiKey?: string;
    host?: string;
    workspaceSlug?: string;
    projectSlug?: string;
    // Trello config
    appKey?: string;
    token?: string;
    boardId?: string;
    listId?: string;
  };
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
}

