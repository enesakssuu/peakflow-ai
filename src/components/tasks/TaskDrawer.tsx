// ============================================================
// PeakFlow AI — Task Details Slide-Over Drawer
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Zap,
  Calendar,
  User as UserIcon,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  History,
  CheckSquare
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  updateTask,
  addTaskComment,
  getTaskComments,
  addTaskActivity,
  getTaskActivities
} from '@/lib/firestore';
import type { Task, WorkspaceMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface TaskDrawerProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
  workspaceMembers: WorkspaceMember[];
  columns: { id: string; title: string; color: string }[];
}

export default function TaskDrawer({
  task,
  isOpen,
  onClose,
  onUpdate,
  workspaceMembers,
  columns
}: TaskDrawerProps) {
  const { t } = useLanguage();
  const { userData } = useAuth();
  
  // Tabs for Comment Feed / Activity History
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  
  // Fields State
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority || null);
  const [assignedToUserId, setAssignedToUserId] = useState(task.assignedToUserId || null);
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate
      ? new Date(task.dueDate).toISOString().split('T')[0]
      : ''
  );
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration);
  const [impactScore, setImpactScore] = useState(task.impactScore);
  
  // Subtasks State
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>(
    task.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Activity Feed State
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // AI Estimation Suggestion Box State
  const [aiSuggest, setAiSuggest] = useState<{ duration: number; impact: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

  // For transition animation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Reset fields to task's latest values
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority || null);
      setAssignedToUserId(task.assignedToUserId || null);
      setDueDate(
        task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : ''
      );
      setEstimatedDuration(task.estimatedDuration);
      setImpactScore(task.impactScore);
      setSubtasks(task.subtasks || []);
      setAiSuggest(null);
      
      // Load Comments & Activity Feed
      fetchComments();
      fetchActivities();
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, task]);

  // Load Comments
  const fetchComments = async () => {
    if (!task.id) return;
    setLoadingComments(true);
    try {
      const list = await getTaskComments(task.id);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Load Activity history
  const fetchActivities = async () => {
    if (!task.id) return;
    setLoadingActivities(true);
    try {
      const list = await getTaskActivities(task.id);
      setActivities(list);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Helper to log activities
  const logActivity = async (type: string, details: any) => {
    if (!userData || !task.id) return;
    try {
      await addTaskActivity(task.id, {
        userId: userData.id,
        userName: userData.name,
        type,
        details
      });
      fetchActivities();
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  // Apply a single field update to Firestore and parent state
  const handleFieldChange = async (fieldName: keyof Task, val: any, logType?: string, logDetails?: any) => {
    if (!task.id) return;
    try {
      const updateObj: Partial<Task> = { [fieldName]: val };
      
      // Special completedAt logic matching firestore.ts rules
      if (fieldName === 'status') {
        if (val === 'completed') {
          updateObj.completedAt = new Date();
        } else {
          updateObj.completedAt = null;
        }
      }

      await updateTask(task.id, updateObj);
      
      // Construct the updated task
      const updated = {
        ...task,
        ...updateObj,
        dueDate: fieldName === 'dueDate' ? (val ? new Date(val) : null) : task.dueDate
      };
      
      onUpdate(updated);

      if (logType) {
        logActivity(logType, logDetails || { val });
      }
    } catch (err) {
      console.error(`Failed to update ${String(fieldName)}:`, err);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userData || !task.id) return;
    
    try {
      await addTaskComment(task.id, {
        userId: userData.id,
        userName: userData.name,
        content: newComment.trim()
      });
      
      setNewComment('');
      fetchComments();
      logActivity('comment', { text: newComment.trim().substring(0, 50) });
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Subtask: Toggle checkbox
  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);
    
    const target = subtasks.find(st => st.id === subtaskId);
    await handleFieldChange(
      'subtasks', 
      updatedSubtasks, 
      'subtask', 
      { title: target?.title, action: target?.completed ? 'incomplete' : 'complete' }
    );
  };

  // Subtask: Add item
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task.id) return;

    const newSub = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      title: newSubtaskTitle.trim(),
      completed: false
    };

    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    
    await handleFieldChange('subtasks', updated, 'subtask', { title: newSub.title, action: 'add' });
  };

  // Subtask: Delete item
  const handleDeleteSubtask = async (subtaskId: string) => {
    const target = subtasks.find(st => st.id === subtaskId);
    const updated = subtasks.filter((st) => st.id !== subtaskId);
    setSubtasks(updated);
    
    await handleFieldChange('subtasks', updated, 'subtask', { title: target?.title, action: 'delete' });
  };

  // AI Estimate Calculation Trigger
  const handleAIEstimate = () => {
    setEstimating(true);
    // Mimic API delay for dynamic micro-animation WOW factor
    setTimeout(() => {
      const text = (title + ' ' + description).toLowerCase();
      let duration = 30;
      let impact = 3;

      if (text.includes('bug') || text.includes('fix') || text.includes('hata')) {
        duration = 20;
        impact = 2;
      }
      if (text.includes('refactor') || text.includes('düzenle') || text.includes('clean')) {
        duration = 60;
        impact = 3;
      }
      if (text.includes('feature') || text.includes('yeni') || text.includes('ekle') || text.includes('create')) {
        duration = 90;
        impact = 4;
      }
      if (text.includes('deploy') || text.includes('yayınla') || text.includes('release') || text.includes('setup')) {
        duration = 45;
        impact = 5;
      }
      if (text.includes('test') || text.includes('deneme')) {
        duration = 30;
        impact = 2;
      }
      if (text.includes('meeting') || text.includes('toplantı') || text.includes('görüşme')) {
        duration = 45;
        impact = 3;
      }

      // Length adjustment
      if (description.length > 200) duration += 30;
      else if (description.length > 100) duration += 15;

      setAiSuggest({
        duration: Math.min(240, duration),
        impact: Math.min(5, Math.max(1, impact))
      });
      setEstimating(false);
    }, 600);
  };

  // Apply AI Estimates
  const applyAIEstimates = async () => {
    if (!aiSuggest) return;
    setEstimatedDuration(aiSuggest.duration);
    setImpactScore(aiSuggest.impact);
    
    await handleFieldChange('estimatedDuration', aiSuggest.duration);
    await handleFieldChange('impactScore', aiSuggest.impact, 'estimate', { duration: aiSuggest.duration, impact: aiSuggest.impact });
    
    setAiSuggest(null);
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Dark blur glass backdrop */}
      <div
        className="absolute inset-0 bg-background/50 backdrop-blur-xs cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`relative w-full max-w-2xl bg-card border-l border-border h-full shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">#{task.id.slice(0, 8)}</span>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="text-xs py-0.5 capitalize border-border">
              {columns.find((c) => c.id === status)?.title || status.replace('_', ' ')}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Area (ColSpan 2) */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Title input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (title.trim() && title !== task.title) {
                      handleFieldChange('title', title.trim(), 'title', { title: title.trim() });
                    }
                  }}
                  className="w-full text-xl font-bold bg-transparent border-0 border-b border-transparent hover:border-border/60 focus:border-accent focus:ring-0 px-0 py-1 transition-all text-foreground"
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  {t('tasks.desc_label')}
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('tasks.desc_label') + '...'}
                  onBlur={() => {
                    if (description !== task.description) {
                      handleFieldChange('description', description, 'desc');
                    }
                  }}
                  className="min-h-[100px] text-sm bg-secondary/20 border-border/80 focus:border-accent rounded-lg"
                />
              </div>

              {/* Subtasks (Checklist) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {t('drawer.subtasks')}
                  </label>
                  {subtasks.length > 0 && (
                    <span className="text-[10px] bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                      {subtasks.filter((s) => s.completed).length} / {subtasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-border/40 group"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm flex-1 min-w-0 select-none">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                        />
                        <span className={`truncate ${st.completed ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                          {st.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <form onSubmit={handleAddSubtask} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={t('drawer.add_subtask')}
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 text-xs h-8 bg-secondary/10 border-border/80 focus:border-accent"
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs font-medium cursor-pointer">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </form>
                </div>
              </div>

              {/* Comments / Activity Feed */}
              <div className="border-t border-border pt-4">
                <div className="flex border-b border-border mb-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-3 ${
                      activeTab === 'comments'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('drawer.comments')}
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 px-3 ${
                      activeTab === 'activity'
                        ? 'border-accent text-accent'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    {t('drawer.activity_feed')}
                  </button>
                </div>

                {activeTab === 'comments' ? (
                  <div className="space-y-4">
                    {/* Comments List */}
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                      {loadingComments ? (
                        <p className="text-xs text-muted-foreground">Loading Comments...</p>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-2 bg-secondary/5 rounded-lg border border-dashed border-border/40">
                          No comments posted yet.
                        </p>
                      ) : (
                        comments.map((c) => (
                          <div key={c.id} className="flex gap-2.5 items-start">
                            <div className="w-7 h-7 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase flex-shrink-0">
                              {c.userName.slice(0, 2)}
                            </div>
                            <div className="bg-secondary/15 border border-border/60 rounded-xl p-2.5 flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5 gap-2">
                                <span className="text-xs font-bold text-foreground truncate">{c.userName}</span>
                                <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Post Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-2 items-start mt-2">
                      <Input
                        type="text"
                        placeholder={t('drawer.write_comment')}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 text-xs h-9 bg-secondary/10 border-border/80 focus:border-accent"
                      />
                      <Button type="submit" size="sm" className="h-9 cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
                        {t('drawer.post_comment')}
                      </Button>
                    </form>
                  </div>
                ) : (
                  // Activity Feed
                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                    {loadingActivities ? (
                      <p className="text-xs text-muted-foreground">Loading Activities...</p>
                    ) : activities.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No operations recorded.</p>
                    ) : (
                      activities.map((act) => {
                        const dateStr = act.createdAt ? new Date(act.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                        let text = '';
                        
                        switch (act.type) {
                          case 'create':
                            text = 'created the task';
                            break;
                          case 'status':
                            text = `updated status to "${columns.find(c => c.id === act.details?.to)?.title || act.details?.to || 'Unknown'}"`;
                            break;
                          case 'assign':
                            text = act.details?.assignedTo
                              ? `assigned this task to ${act.details.assignedTo}`
                              : 'removed assignee';
                            break;
                          case 'duedate':
                            text = act.details?.date
                              ? `scheduled due date for ${act.details.date}`
                              : 'removed the due date';
                            break;
                          case 'priority':
                            text = act.details?.level
                              ? `set priority to "${act.details.level.toUpperCase()}"`
                              : 'cleared priority';
                            break;
                          case 'subtask':
                            text = `subtask "${act.details?.title}": ${act.details?.action}`;
                            break;
                          case 'estimate':
                            text = `updated estimation: ${act.details?.duration}m duration, Impact: ${act.details?.impact}`;
                            break;
                          default:
                            text = `updated fields`;
                        }

                        return (
                          <div key={act.id} className="flex gap-2 items-start text-xs">
                            <div className="w-5 h-5 rounded-full bg-secondary/30 flex items-center justify-center text-[9px] text-muted-foreground font-bold flex-shrink-0 uppercase">
                              {act.userName.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground mr-1">{act.userName}</span>
                                {text}
                              </p>
                              <span className="text-[9px] text-muted-foreground/60">{dateStr}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Sidebar Controls (ColSpan 1) */}
            <div className="space-y-5 border-l border-border/40 pl-0 md:pl-4">
              
              {/* Status control */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  {t('team_board.status')}
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const toStatus = e.target.value;
                    setStatus(toStatus);
                    handleFieldChange('status', toStatus, 'status', { from: status, to: toStatus });
                  }}
                  className="w-full text-xs bg-secondary/15 border border-border/80 focus:border-accent focus:ring-0 rounded-lg p-2 font-medium cursor-pointer text-foreground"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee control */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  {t('team_board.assignee')}
                </label>
                <select
                  value={assignedToUserId || ''}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setAssignedToUserId(val);
                    const memberName = workspaceMembers.find((m) => m.userId === val)?.userName || null;
                    handleFieldChange('assignedToUserId', val, 'assign', { assignedTo: memberName });
                  }}
                  className="w-full text-xs bg-secondary/15 border border-border/80 focus:border-accent focus:ring-0 rounded-lg p-2 font-medium cursor-pointer text-foreground"
                >
                  <option value="">{t('team_board.unassigned')}</option>
                  {workspaceMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date Calendar control */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('drawer.due_date')}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDueDate(val);
                    handleFieldChange('dueDate', val ? new Date(val) : null, 'duedate', { date: val });
                  }}
                  className="w-full text-xs bg-secondary/15 border border-border/80 focus:border-accent focus:ring-0 rounded-lg p-2 font-medium cursor-pointer text-foreground"
                />
              </div>

              {/* Priority control */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {t('drawer.priority')}
                </label>
                <select
                  value={priority || ''}
                  onChange={(e) => {
                    const val = (e.target.value as any) || null;
                    setPriority(val);
                    handleFieldChange('priority', val, 'priority', { level: val });
                  }}
                  className="w-full text-xs bg-secondary/15 border border-border/80 focus:border-accent focus:ring-0 rounded-lg p-2 font-medium cursor-pointer text-foreground"
                >
                  <option value="">None</option>
                  <option value="low">{t('drawer.priority_low')}</option>
                  <option value="medium">{t('drawer.priority_medium')}</option>
                  <option value="high">{t('drawer.priority_high')}</option>
                  <option value="urgent">{t('drawer.priority_urgent')}</option>
                </select>
              </div>

              {/* Duration & Impact controls with AI estimate */}
              <div className="space-y-4 pt-2 border-t border-border/40">
                
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {t('tasks.duration_label')} (mins)
                  </label>
                  <Input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEstimatedDuration(val);
                    }}
                    onBlur={() => {
                      if (estimatedDuration !== task.estimatedDuration) {
                        handleFieldChange('estimatedDuration', estimatedDuration);
                      }
                    }}
                    className="text-xs h-8 bg-secondary/15 border-border/80 focus:border-accent"
                  />
                </div>

                {/* Impact slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-warning fill-warning" />
                      {t('tasks.impact_label')}
                    </label>
                    <span className="font-bold text-foreground">{impactScore}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={impactScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setImpactScore(val);
                    }}
                    onMouseUp={() => {
                      if (impactScore !== task.impactScore) {
                        handleFieldChange('impactScore', impactScore);
                      }
                    }}
                    onTouchEnd={() => {
                      if (impactScore !== task.impactScore) {
                        handleFieldChange('impactScore', impactScore);
                      }
                    }}
                    className="w-full accent-accent bg-secondary/30 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* AI Estimate Trigger & Box */}
                <div className="space-y-3 pt-1">
                  <Button
                    onClick={handleAIEstimate}
                    disabled={estimating}
                    className="w-full text-xs h-8 bg-accent/15 hover:bg-accent/25 border border-accent/25 text-accent font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${estimating ? 'animate-pulse' : ''}`} />
                    {estimating ? t('drawer.ai_estimating') : t('drawer.ai_estimate_btn')}
                  </Button>

                  {aiSuggest && (
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2.5 animate-fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Suggestion</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-secondary/15 rounded-lg p-2 border border-border/40">
                          <p className="text-muted-foreground text-[10px] uppercase font-semibold">Duration</p>
                          <p className="font-bold text-foreground mt-0.5">{aiSuggest.duration} mins</p>
                        </div>
                        <div className="bg-secondary/15 rounded-lg p-2 border border-border/40">
                          <p className="text-muted-foreground text-[10px] uppercase font-semibold">Impact</p>
                          <p className="font-bold text-foreground mt-0.5">{aiSuggest.impact} / 5</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={applyAIEstimates}
                        className="w-full h-7 text-[10px] font-semibold bg-accent hover:bg-accent/90 text-accent-foreground cursor-pointer"
                      >
                        Apply Recommendations
                      </Button>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
