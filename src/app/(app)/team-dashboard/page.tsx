// ============================================================
// PeakFlow AI — Team Workspace Dashboard
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  getTasks,
  getFocusSessions,
  updateTask,
  createTask,
  deleteTask,
  updateWorkspaceColumns
} from '@/lib/firestore';
import { calculateMomentumScore } from '@/lib/ai-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TaskDialog from '@/components/tasks/TaskDialog';
import TaskDrawer from '@/components/tasks/TaskDrawer';
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
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Layers,
  UserCheck,
  Trash2,
  Pencil,
  Grid,
  List,
  Table,
  ArrowLeft,
  ArrowRight,
  Settings,
  Search,
  SlidersHorizontal,
  Calendar,
  CheckSquare
} from 'lucide-react';
import type { Task, FocusSession, MomentumData } from '@/types';

const PREDEFINED_COLORS = [
  '#0284c7', // Sky Blue
  '#d97706', // Amber
  '#059669', // Emerald
  '#475569', // Slate
  '#e11d48', // Rose
  '#7c3aed', // Violet
  '#2563eb', // Blue
  '#0891b2'  // Cyan
];

export default function TeamDashboardPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId, activeWorkspace, members, refreshWorkspaceData } = useWorkspace();
  const { t } = useLanguage();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSessions, setActiveSessions] = useState<FocusSession[]>([]);
  const [momentum, setMomentum] = useState<MomentumData>({
    score: 0,
    trend: 'stable',
    label: 'Fresh Start ✨',
  });
  const [loading, setLoading] = useState(true);

  // View mode: 'board' | 'list' | 'table'
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'table'>('board');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // Column Visibility state (stored in localStorage)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

  // List View Collapsed state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Column Modification Modal/Inputs
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState(PREDEFINED_COLORS[0]);

  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');

  // Task Creation quick dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<string>('todo');

  // Task slide-over drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Default Columns list
  const defaultColumns = [
    { id: 'backlog', title: t('tasks.backlog') || 'Backlog', color: '#64748b' },
    { id: 'todo', title: t('tasks.todo') || 'Todo', color: '#0284c7' },
    { id: 'in_progress', title: t('tasks.in_progress') || 'In Progress', color: '#f59e0b' },
    { id: 'completed', title: t('tasks.completed') || 'Done', color: '#10b981' }
  ];

  // Resolve current active columns
  const activeColumns = activeWorkspace?.columns && activeWorkspace.columns.length > 0
    ? activeWorkspace.columns
    : defaultColumns;

  // Load preferences from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedColPrefs = localStorage.getItem(`peakflow_cols_visible_${currentWorkspaceId}`);
      if (savedColPrefs) {
        try {
          setVisibleColumns(JSON.parse(savedColPrefs));
        } catch (e) {
          console.error(e);
        }
      }
      const savedView = localStorage.getItem('peakflow_dashboard_view_mode') as any;
      if (savedView && ['board', 'list', 'table'].includes(savedView)) {
        setViewMode(savedView);
      }
    }
  }, [currentWorkspaceId]);

  // Persist view mode changes
  const handleViewModeChange = (mode: 'board' | 'list' | 'table') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peakflow_dashboard_view_mode', mode);
    }
  };

  // Toggle Visibility
  const toggleColumnVisibility = (colId: string) => {
    const isVisible = visibleColumns[colId] !== false; // defaults to true
    const updated = { ...visibleColumns, [colId]: !isVisible };
    setVisibleColumns(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`peakflow_cols_visible_${currentWorkspaceId}`, JSON.stringify(updated));
    }
  };

  const loadTeamDashboardData = useCallback(async () => {
    if (!firebaseUser || currentWorkspaceId === 'personal') {
      setLoading(false);
      return;
    }

    try {
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

      // Filter out sessions older than 3 hours
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
    const interval = setInterval(loadTeamDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadTeamDashboardData]);

  // Column Operations
  const handleAddCol = async () => {
    if (!activeWorkspace || !newColTitle.trim()) return;
    const newCol = {
      id: 'col_' + Math.random().toString(36).substr(2, 9),
      title: newColTitle.trim(),
      color: newColColor
    };
    const updated = [...activeColumns, newCol];
    await updateWorkspaceColumns(activeWorkspace.id, updated);
    setNewColTitle('');
    setShowAddCol(false);
    await refreshWorkspaceData();
  };

  const handleStartRename = (colId: string, title: string) => {
    setEditingColId(colId);
    setEditingColTitle(title);
  };

  const handleSaveRename = async (colId: string) => {
    if (!activeWorkspace || !editingColTitle.trim()) return;
    const updated = activeColumns.map((c) =>
      c.id === colId ? { ...c, title: editingColTitle.trim() } : c
    );
    await updateWorkspaceColumns(activeWorkspace.id, updated);
    setEditingColId(null);
    await refreshWorkspaceData();
  };

  const handleDeleteCol = async (colId: string) => {
    if (!activeWorkspace) return;
    
    // Validation: check if it has tasks
    const hasTasks = tasks.some((t) => t.status === colId);
    if (hasTasks) {
      alert('Cannot delete this column because it currently contains active tasks. Please move the tasks first.');
      return;
    }

    if (colId === 'completed') {
      alert(t('team_board.cant_delete_completed') || 'Cannot delete completed column.');
      return;
    }

    if (confirm('Are you sure you want to delete this column?')) {
      const updated = activeColumns.filter((c) => c.id !== colId);
      await updateWorkspaceColumns(activeWorkspace.id, updated);
      await refreshWorkspaceData();
    }
  };

  const handleMoveCol = async (index: number, direction: 'left' | 'right') => {
    if (!activeWorkspace) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeColumns.length) return;

    const newCols = [...activeColumns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;

    await updateWorkspaceColumns(activeWorkspace.id, newCols);
    await refreshWorkspaceData();
  };

  // Task Assign inline
  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      await updateTask(taskId, { assignedToUserId: userId || null });
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  // Task Status update inline
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Task Fields Inline updates (table spreadsheet mode support)
  const handleInlineTaskUpdate = async (taskId: string, fields: Partial<Task>) => {
    try {
      await updateTask(taskId, fields);
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error in inline task update:', err);
    }
  };

  // Open Quick Dialog to add task
  const handleOpenAddTaskDialog = (colId: string) => {
    setTargetColumnStatus(colId);
    setDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        await loadTeamDashboardData();
        if (selectedTask?.id === taskId) {
          setSelectedTask(null);
        }
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleSaveQuickTask = async (data: {
    title: string;
    estimatedDuration: number;
    impactScore: number;
    description?: string;
  }) => {
    if (!firebaseUser) return;
    try {
      await createTask(firebaseUser.uid, {
        ...data,
        status: targetColumnStatus,
        workspaceId: currentWorkspaceId,
      } as any);
      await loadTeamDashboardData();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Filter and Sort calculation
  const getFilteredAndSortedTasks = (colId?: string) => {
    let list = tasks;
    
    // If colId is specified, group filter
    if (colId) {
      list = list.filter((t) => t.status === colId);
    }

    // Search input
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Assignee filter
    if (assigneeFilter === 'me') {
      list = list.filter((t) => t.assignedToUserId === firebaseUser?.uid);
    } else if (assigneeFilter === 'unassigned') {
      list = list.filter((t) => !t.assignedToUserId);
    } else if (assigneeFilter !== 'all') {
      list = list.filter((t) => t.assignedToUserId === assigneeFilter);
    }

    // Priority filter
    if (priorityFilter === 'none') {
      list = list.filter((t) => !t.priority);
    } else if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      }
      if (sortBy === 'priority') {
        const priorityScore: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aVal = priorityScore[a.priority || ''] || 0;
        const bVal = priorityScore[b.priority || ''] || 0;
        return bVal - aVal;
      }
      if (sortBy === 'impact') {
        return b.impactScore - a.impactScore;
      }
      if (sortBy === 'duration') {
        return b.estimatedDuration - a.estimatedDuration;
      }
      // default: createdAt descending
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return list;
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            {t('sidebar.team_dashboard')}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
            {activeWorkspace?.name}
          </h1>
        </div>
        
        {/* Momentum Stats */}
        <div className="flex items-center gap-3 bg-secondary/30 rounded-2xl px-4 py-2 border border-border/40 w-fit">
          <Flame className="w-5 h-5 text-warning animate-pulse-soft" />
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {t('team_board.momentum')}
            </p>
            <p className="text-sm font-extrabold text-foreground">
              {momentum.score}/100 — {momentum.label}
            </p>
          </div>
        </div>
      </div>

      {/* Standings Banner */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xs">
        <CardHeader className="py-3.5 border-b border-border/40">
          <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Users className="w-4 h-4 text-accent" />
            {t('team_board.standings')} ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {members.map((member) => {
              const activeSession = activeSessions.find((s) => s.userId === member.userId);
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-secondary/5 hover:bg-secondary/10 hover:border-border/60 transition-all duration-200"
                >
                  <div className="relative shrink-0">
                    <div className="w-8.5 h-8.5 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent uppercase border border-accent/25">
                      {member.userName.slice(0, 2)}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${
                      activeSession ? 'bg-success animate-pulse' : 'bg-muted-foreground/35'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{member.userName}</p>
                    {activeSession ? (
                      <span className="text-[10px] text-success font-medium flex items-center gap-1 mt-0.5 animate-pulse-soft truncate">
                        Focusing: &quot;{activeSession.taskTitle}&quot;
                      </span>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Idle</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* View Switchers & Controls Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-secondary/15 border border-border/45 rounded-2xl">
        {/* Left Side: View tabs */}
        <div className="flex items-center gap-1.5 bg-secondary/35 p-1 rounded-xl w-fit">
          <button
            onClick={() => handleViewModeChange('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'board' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            {t('team_board.view_board')}
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            {t('team_board.view_list')}
          </button>
          <button
            onClick={() => handleViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            {t('team_board.view_table')}
          </button>
        </div>

        {/* Right Side: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8.5 h-8.5 w-44 bg-card border-border/80 rounded-xl focus:border-accent"
            />
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1 text-xs">
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-card border border-border/80 focus:border-accent rounded-xl text-xs px-2 py-1.5 cursor-pointer font-medium text-foreground"
            >
              <option value="all">{t('team_board.filter_all_tasks')}</option>
              <option value="me">{t('team_board.filter_my_tasks')}</option>
              <option value="unassigned">{t('team_board.filter_unassigned')}</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.userName}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-card border border-border/80 focus:border-accent rounded-xl text-xs px-2.5 py-1.5 cursor-pointer font-medium text-foreground"
          >
            <option value="all">All Priorities</option>
            <option value="low">{t('drawer.priority_low')}</option>
            <option value="medium">{t('drawer.priority_medium')}</option>
            <option value="high">{t('drawer.priority_high')}</option>
            <option value="urgent">{t('drawer.priority_urgent')}</option>
            <option value="none">No Priority</option>
          </select>

          {/* Sorter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card border border-border/80 focus:border-accent rounded-xl text-xs px-2.5 py-1.5 cursor-pointer font-medium text-foreground"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="impact">Impact</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {/* Column Configurator panel */}
      <div className="flex flex-col gap-3 bg-secondary/25 border border-border/40 rounded-2xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('team_board.configure_columns')}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddCol(!showAddCol)}
            className="h-7 text-xs text-accent hover:bg-accent/10 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t('team_board.add_column')}
          </Button>
        </div>

        {/* Add Column inline panel */}
        {showAddCol && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-xl animate-scale-in">
            <Input
              type="text"
              placeholder={t('team_board.column_title_placeholder') || 'Column Name'}
              value={newColTitle}
              onChange={(e) => setNewColTitle(e.target.value)}
              className="text-xs h-8 w-44"
            />
            {/* Predefined Colors dot list */}
            <div className="flex items-center gap-1.5">
              {PREDEFINED_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={() => setNewColColor(col)}
                  className={`w-4 h-4 rounded-full border cursor-pointer transition-all ${
                    newColColor === col ? 'scale-120 border-white ring-2 ring-accent' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            <Button size="sm" onClick={handleAddCol} className="h-8 text-xs cursor-pointer font-medium bg-accent hover:bg-accent/90 text-accent-foreground">
              Add
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {activeColumns.map((col) => {
            const isVisible = visibleColumns[col.id] !== false;
            return (
              <button
                key={col.id}
                onClick={() => toggleColumnVisibility(col.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isVisible
                    ? 'border-accent/40 bg-accent/5 text-accent shadow-xs'
                    : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                {isVisible ? <Eye className="w-3 h-3 text-accent" /> : <EyeOff className="w-3 h-3 text-muted-foreground/60" />}
                <span>{col.title}</span>
                <Badge variant="secondary" className="ml-1 text-[9px] py-0 px-1 bg-background/50 border border-border/10">
                  {tasks.filter((t) => t.status === col.id).length}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. BOARD VIEW (KANBAN) */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === 'board' && (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin">
          {activeColumns
            .filter((col) => visibleColumns[col.id] !== false)
            .map((col, index) => {
              const colTasks = getFilteredAndSortedTasks(col.id);
              const isRenameMode = editingColId === col.id;

              return (
                <div
                  key={col.id}
                  className="flex-shrink-0 w-80 rounded-2xl border border-border/40 p-4 flex flex-col max-h-[70vh] min-h-[450px] bg-secondary/10"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2 gap-2 group/header">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                      
                      {isRenameMode ? (
                        <input
                          type="text"
                          value={editingColTitle}
                          onChange={(e) => setEditingColTitle(e.target.value)}
                          onBlur={() => handleSaveRename(col.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(col.id)}
                          className="bg-card text-xs border border-accent rounded px-1.5 py-0.5 w-full font-bold focus:outline-hidden"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider truncate">
                          {col.title}
                        </h3>
                      )}

                      <Badge variant="secondary" className="text-[9px] h-4.5 px-1 bg-background border border-border/15 shrink-0 font-bold">
                        {colTasks.length}
                      </Badge>
                    </div>

                    {/* Column controls */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveCol(index, 'left')}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Move Left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {index < activeColumns.length - 1 && (
                        <button
                          onClick={() => handleMoveCol(index, 'right')}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Move Right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartRename(col.id, col.title)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteCol(col.id)}
                        className="p-1 hover:bg-secondary rounded text-destructive hover:bg-destructive/10 cursor-pointer"
                        title={t('team_board.delete_column') || 'Delete Column'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleOpenAddTaskDialog(col.id)}
                        className="p-1 hover:bg-secondary rounded text-accent hover:bg-accent/10 cursor-pointer"
                        title="Add Task"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cards Stack */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-muted-foreground border border-dashed border-border/40 rounded-xl p-4 bg-background/5">
                        {t('team_board.empty_column')}
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isAssignedToMe = task.assignedToUserId === firebaseUser?.uid;
                        
                        // Checklist progress
                        const totalSubtasks = task.subtasks?.length || 0;
                        const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                        const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className="bg-card border border-border/50 hover:border-border/90 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 group flex flex-col gap-3 relative cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-extrabold text-xs text-foreground leading-snug hover:text-accent transition-colors">
                                  {task.title}
                                </span>
                                {task.priority && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-[8px] tracking-wider uppercase font-bold shrink-0 border py-0 px-1 ${
                                      task.priority === 'urgent'
                                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                                        : task.priority === 'high'
                                          ? 'bg-warning/10 text-warning border-warning/20'
                                          : task.priority === 'medium'
                                            ? 'bg-accent/10 text-accent border-accent/20'
                                            : 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
                                    }`}
                                  >
                                    {t(`drawer.priority_${task.priority}`) || task.priority}
                                  </Badge>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                                  {task.description}
                                </p>
                              )}

                              {/* Subtasks Progress Bar */}
                              {totalSubtasks > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                                    <span>Checklist</span>
                                    <span>{completedSubtasks}/{totalSubtasks} ({subtaskPercentage}%)</span>
                                  </div>
                                  <div className="w-full bg-secondary/40 h-1 rounded-full overflow-hidden">
                                    <div className="bg-accent h-full transition-all duration-300" style={{ width: `${subtaskPercentage}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="flex items-center gap-1 text-[9px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5 font-medium">
                                <Clock className="w-2.5 h-2.5 text-muted-foreground/75" />
                                {task.estimatedDuration}m
                              </span>
                              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5 font-medium">
                                <Zap className="w-2.5 h-2.5 text-warning fill-warning" />
                                {task.impactScore}
                              </span>

                              {task.dueDate && (
                                <span className={`flex items-center gap-1 text-[9px] rounded-full px-2 py-0.5 font-semibold ${
                                  new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed'
                                    ? 'bg-destructive/15 text-destructive border border-destructive/20'
                                    : 'bg-secondary/50 text-muted-foreground'
                                }`}>
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            <div className="border-t border-border/40 pt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Assignee select */}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {t('team_board.assignee')}
                                </span>
                                <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-lg px-1.5 py-0.5 text-[10px]">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <select
                                    value={task.assignedToUserId || ''}
                                    onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                                    className="bg-transparent font-semibold text-foreground outline-hidden text-[9px] cursor-pointer max-w-[100px]"
                                  >
                                    <option value="">{t('team_board.unassigned')}</option>
                                    {members.map((m) => (
                                      <option key={m.userId} value={m.userId}>
                                        {m.userName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {t('team_board.status')}
                                  </span>
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                    className="bg-transparent text-[9px] font-bold text-accent outline-hidden cursor-pointer max-w-[90px] border border-border/30 rounded px-1 py-0.5"
                                  >
                                    {activeColumns.map(c => (
                                      <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                  </select>
                                </div>

                                {task.status !== 'completed' && (
                                  isAssignedToMe ? (
                                    <Button
                                      size="sm"
                                      className="bg-accent text-white hover:bg-accent/90 h-6 px-2 text-[9px] rounded-lg shrink-0 cursor-pointer font-medium"
                                      onClick={() => router.push(`/focus/${task.id}`)}
                                    >
                                      <Play className="w-2.5 h-2.5 mr-1 fill-current" />
                                      {t('team_board.focus')}
                                    </Button>
                                  ) : (
                                    task.assignedToUserId === null && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="hover:border-accent hover:text-accent h-6 px-2 text-[9px] rounded-lg shrink-0 cursor-pointer font-medium"
                                        onClick={() => handleAssignTask(task.id, firebaseUser?.uid || null)}
                                      >
                                        <UserCheck className="w-2.5 h-2.5 mr-1" />
                                        {t('team_board.claim')}
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
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2. LIST VIEW (COLLAPSIBLE ACCORDION) */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {activeColumns
            .filter((col) => visibleColumns[col.id] !== false)
            .map((col) => {
              const colTasks = getFilteredAndSortedTasks(col.id);
              const isCollapsed = collapsedGroups[col.id] === true;

              return (
                <div key={col.id} className="border border-border/40 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-xs">
                  {/* Collapsible Accordion Header */}
                  <div
                    onClick={() => setCollapsedGroups({ ...collapsedGroups, [col.id]: !isCollapsed })}
                    className="flex items-center justify-between p-4 bg-secondary/10 border-b border-border/20 cursor-pointer hover:bg-secondary/15 select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                      <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">{col.title}</h3>
                      <Badge variant="secondary" className="text-[9px] h-4.5 px-1 bg-background font-bold">
                        {colTasks.length}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddTaskDialog(col.id);
                      }}
                      className="h-7 text-xs text-accent hover:bg-accent/10 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Task
                    </Button>
                  </div>

                  {/* Tasks List Content */}
                  {!isCollapsed && (
                    <div className="p-2 divide-y divide-border/20">
                      {colTasks.length === 0 ? (
                        <p className="text-center py-6 text-xs text-muted-foreground italic">
                          No tasks under this status.
                        </p>
                      ) : (
                        colTasks.map((task) => {
                          const totalSubtasks = task.subtasks?.length || 0;
                          const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-secondary/10 transition-colors cursor-pointer gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'completed'}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => handleStatusChange(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                                  className="mt-0.5 rounded border-border text-accent focus:ring-accent w-4 h-4 shrink-0 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-foreground truncate hover:text-accent transition-colors">
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Badges panel */}
                              <div className="flex items-center gap-3.5 flex-wrap text-xs sm:justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                                {task.priority && (
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-wider py-0 px-1.5 h-4.5 border-border/80">
                                    {t(`drawer.priority_${task.priority}`)}
                                  </Badge>
                                )}

                                {totalSubtasks > 0 && (
                                  <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                                    <CheckSquare className="w-3 h-3 text-accent" />
                                    {completedSubtasks}/{totalSubtasks}
                                  </span>
                                )}

                                {task.dueDate && (
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}

                                <div className="flex items-center gap-1 bg-secondary/40 border border-border/40 rounded-lg px-1.5 py-0.5 text-[9px]">
                                  <User className="w-2.5 h-2.5 text-muted-foreground" />
                                  <select
                                    value={task.assignedToUserId || ''}
                                    onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                                    className="bg-transparent font-medium text-foreground outline-hidden cursor-pointer"
                                  >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                      <option key={m.userId} value={m.userId}>{m.userName}</option>
                                    ))}
                                  </select>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 3. TABLE VIEW (SPREADSHEET GRID) */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <Card className="border-border/40 overflow-hidden bg-card/35 backdrop-blur-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="p-3">Task Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assignee</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-center">Duration (m)</th>
                  <th className="p-3 text-center">Impact</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/25">
                {getFilteredAndSortedTasks().length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground italic">
                      No tasks found matching current filters.
                    </td>
                  </tr>
                ) : (
                  getFilteredAndSortedTasks().map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-secondary/5 transition-colors text-xs group"
                    >
                      {/* Title */}
                      <td className="p-3 font-bold text-foreground max-w-[200px] truncate">
                        <span
                          onClick={() => setSelectedTask(task)}
                          className="hover:text-accent hover:underline cursor-pointer transition-all"
                        >
                          {task.title}
                        </span>
                      </td>

                      {/* Status select dropdown */}
                      <td className="p-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="bg-secondary/10 border border-border/40 rounded px-1.5 py-0.5 text-[11px] font-semibold text-accent outline-hidden cursor-pointer"
                        >
                          {activeColumns.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                      </td>

                      {/* Assignee select dropdown */}
                      <td className="p-3">
                        <select
                          value={task.assignedToUserId || ''}
                          onChange={(e) => handleAssignTask(task.id, e.target.value || null)}
                          className="bg-secondary/10 border border-border/40 rounded px-1.5 py-0.5 text-[11px] font-semibold outline-hidden cursor-pointer text-foreground"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>{m.userName}</option>
                          ))}
                        </select>
                      </td>

                      {/* Priority select dropdown */}
                      <td className="p-3">
                        <select
                          value={task.priority || ''}
                          onChange={(e) => handleInlineTaskUpdate(task.id, { priority: (e.target.value as any) || null })}
                          className="bg-secondary/10 border border-border/40 rounded px-1.5 py-0.5 text-[11px] font-semibold outline-hidden cursor-pointer text-foreground"
                        >
                          <option value="">None</option>
                          <option value="low">{t('drawer.priority_low')}</option>
                          <option value="medium">{t('drawer.priority_medium')}</option>
                          <option value="high">{t('drawer.priority_high')}</option>
                          <option value="urgent">{t('drawer.priority_urgent')}</option>
                        </select>
                      </td>

                      {/* Due Date picker input */}
                      <td className="p-3">
                        <input
                          type="date"
                          value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) =>
                            handleInlineTaskUpdate(task.id, {
                              dueDate: e.target.value ? new Date(e.target.value) : null
                            })
                          }
                          className="bg-secondary/10 border border-border/40 rounded px-1 py-0.5 text-[11px] outline-hidden cursor-pointer text-foreground"
                        />
                      </td>

                      {/* Duration Input number */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={task.estimatedDuration}
                          onChange={(e) =>
                            handleInlineTaskUpdate(task.id, {
                              estimatedDuration: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-16 bg-secondary/10 border border-border/40 rounded px-1 py-0.5 text-[11px] text-center outline-hidden text-foreground"
                        />
                      </td>

                      {/* Impact Score slider */}
                      <td className="p-3 text-center font-bold text-foreground">
                        {task.impactScore}
                      </td>

                      {/* Delete actions */}
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* DIALOG & SLIDE-OVER DRAWER TRIGGERS */}
      {/* ──────────────────────────────────────────────────────── */}
      {/* Quick Task Creation Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={null}
        onSave={handleSaveQuickTask}
      />

      {/* Right Drawer Slide-over for details */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            // Update in local tasks array state
            setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
            setSelectedTask(updatedTask);
          }}
          workspaceMembers={members}
          columns={activeColumns}
        />
      )}
    </div>
  );
}
