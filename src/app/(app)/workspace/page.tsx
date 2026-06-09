// ============================================================
// PeakFlow AI — Workspace Settings & Invites Page
// ============================================================

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Send,
  UserPlus,
  Mail,
  Check,
  X,
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function WorkspacePage() {
  const { firebaseUser } = useAuth();
  const {
    currentWorkspaceId,
    activeWorkspace,
    workspaces,
    members,
    pendingInvitations,
    sentInvitations,
    createTeamWorkspace,
    inviteUser,
    removeMember,
    acceptInvite,
    declineInvite,
    cancelInvite,
    switchWorkspace,
  } = useWorkspace();

  // Create Workspace Form
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Invite Member Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreateLoading(true);
    setCreateError('');
    try {
      await createTeamWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create workspace');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess(false);
    try {
      await inviteUser(inviteEmail.trim().toLowerCase(), inviteRole);
      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // Check if current user is owner or admin in the active workspace
  const currentUserMembership = members.find((m) => m.userId === firebaseUser?.uid);
  const canManageInvitations = currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-muted-foreground mt-2">
          Manage team workspaces, roles, and collaborative projects.
        </p>
      </div>

      {/* Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card className="border-accent/30 bg-accent/5 shadow-md shadow-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-accent">
              <UserPlus className="w-5 h-5" />
              Pending Workspace Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {invite.workspaceName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invited by {invite.invitedByUserName} as{' '}
                    <Badge variant="secondary" className="capitalize text-[10px] py-0 px-1.5 ml-1">
                      {invite.role}
                    </Badge>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-success text-white hover:bg-success/90"
                    onClick={() => acceptInvite(invite.id)}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={() => declineInvite(invite.id)}
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Workspace Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Switcher & Creator */}
        <div className="space-y-8 lg:col-span-1">
          {/* Workspace List */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-accent" />
                Your Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <button
                onClick={() => switchWorkspace('personal')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  currentWorkspaceId === 'personal'
                    ? 'border-accent bg-accent/5 text-accent'
                    : 'border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Personal Space</span>
                {currentWorkspaceId === 'personal' && <Badge variant="accent">Active</Badge>}
              </button>

              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left truncate ${
                    currentWorkspaceId === w.id
                      ? 'border-accent bg-accent/5 text-accent font-semibold'
                      : 'border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                  {currentWorkspaceId === w.id && <Badge variant="accent">Active</Badge>}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Create Workspace */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-accent" />
                New Team Workspace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wname">Workspace Name</Label>
                  <Input
                    id="wname"
                    placeholder="e.g., Marketing Team"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    required
                    disabled={createLoading}
                  />
                </div>
                {createError && (
                  <p className="text-xs text-destructive bg-destructive/5 p-2 rounded-lg">
                    {createError}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="accent"
                  className="w-full"
                  disabled={createLoading || !newWorkspaceName.trim()}
                >
                  {createLoading ? 'Creating...' : 'Create Workspace'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings for Active Workspace */}
        <div className="lg:col-span-2">
          {currentWorkspaceId === 'personal' ? (
            <Card className="border-border/50 bg-secondary/20 border-dashed h-full flex items-center justify-center p-8 text-center min-h-[300px]">
              <div className="max-w-md">
                <Lock className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-foreground">Personal Space</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Your Personal Space is completely private and sandboxed. None of your tasks, focus sessions, or daily reviews here are visible to anyone else.
                </p>
                <p className="text-xs text-muted-foreground/80 mt-4 leading-relaxed">
                  Select a team workspace on the left or create a new one to invite members and collaborate.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Workspace Members list */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    Workspace Members & Invitations ({members.length + sentInvitations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/60">
                  {/* Active Members */}
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                          {member.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {member.userName}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-success font-semibold bg-success/10 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                              Joined
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {member.userEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={member.role === 'owner' ? 'accent' : 'secondary'} className="capitalize">
                          {member.role}
                        </Badge>
                        {canManageInvitations &&
                          member.role !== 'owner' &&
                          member.userId !== firebaseUser?.uid && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMember(member.userId)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}

                  {/* Sent Invitations (ekibin altında) */}
                  {sentInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between py-4 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0 border border-border/40">
                          @
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {invite.invitedEmail}
                            </span>
                            {invite.status === 'pending' ? (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold bg-secondary/80 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                                Pending
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-destructive font-semibold bg-destructive/10 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                Declined
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Invited by {invite.invitedByUserName || 'someone'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize text-[10px] text-muted-foreground border-dashed">
                          {invite.role}
                        </Badge>
                        {canManageInvitations && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => cancelInvite(invite.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Invite Form */}
              {canManageInvitations && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Send className="w-5 h-5 text-accent" />
                      Invite Team Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInviteUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="iemail">Username or Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="iemail"
                              type="text"
                              placeholder="e.g., @enes or colleague@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              className="pl-10"
                              required
                              disabled={inviteLoading}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="irole">Role</Label>
                          <select
                            id="irole"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium transition-all focus:border-accent"
                            disabled={inviteLoading}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      {inviteError && (
                        <p className="text-xs text-destructive bg-destructive/5 p-2.5 rounded-lg">
                          {inviteError}
                        </p>
                      )}
                      {inviteSuccess && (
                        <p className="text-xs text-success bg-success/5 p-2.5 rounded-lg flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Invitation sent successfully!
                        </p>
                      )}

                      <Button
                        type="submit"
                        variant="accent"
                        className="w-full sm:w-auto"
                        disabled={inviteLoading || !inviteEmail.trim()}
                      >
                        {inviteLoading ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
