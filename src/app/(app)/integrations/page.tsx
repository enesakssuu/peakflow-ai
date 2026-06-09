// ============================================================
// PeakFlow AI — Integrations & Issue Sync Page
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getIntegrations, saveIntegration, deleteIntegration } from '@/lib/firestore';
import {
  Link2,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  CloudLightning,
  Workflow,
  ListTodo
} from 'lucide-react';
import type { Integration } from '@/types';

export default function IntegrationsPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId, activeWorkspace } = useWorkspace();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [activeForm, setActiveForm] = useState<'plane' | 'trello' | null>(null);
  
  // Plane Form fields
  const [planeHost, setPlaneHost] = useState('https://app.plane.so');
  const [planeApiKey, setPlaneApiKey] = useState('');
  const [planeWorkspace, setPlaneWorkspace] = useState('');
  const [planeProject, setPlaneProject] = useState('');

  // Trello Form fields
  const [trelloKey, setTrelloKey] = useState('');
  const [trelloToken, setTrelloToken] = useState('');
  const [trelloBoard, setTrelloBoard] = useState('');
  const [trelloList, setTrelloList] = useState('');

  // Submission / Sync status
  const [formLoading, setFormLoading] = useState(false);
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ id: string; success: boolean; count?: number; message?: string } | null>(null);

  const targetId = currentWorkspaceId === 'personal' ? firebaseUser?.uid || '' : currentWorkspaceId;
  const targetType = currentWorkspaceId === 'personal' ? 'personal' : 'workspace';

  const loadIntegrations = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const data = await getIntegrations(targetId);
      setIntegrations(data);
    } catch (err) {
      console.error('Error loading integrations:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadIntegrations();
    setActiveForm(null);
  }, [targetId, loadIntegrations]);

  const handleSavePlane = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planeApiKey || !planeWorkspace || !planeProject) return;
    setFormLoading(true);
    try {
      await saveIntegration(targetId, targetType, 'plane', {
        host: planeHost,
        apiKey: planeApiKey,
        workspaceSlug: planeWorkspace,
        projectSlug: planeProject,
      });
      await loadIntegrations();
      setActiveForm(null);
      // Clear sensitive fields
      setPlaneApiKey('');
    } catch (err) {
      console.error('Error saving Plane integration:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveTrello = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trelloKey || !trelloToken || (!trelloBoard && !trelloList)) return;
    setFormLoading(true);
    try {
      await saveIntegration(targetId, targetType, 'trello', {
        appKey: trelloKey,
        token: trelloToken,
        boardId: trelloBoard,
        listId: trelloList,
      });
      await loadIntegrations();
      setActiveForm(null);
      // Clear sensitive fields
      setTrelloToken('');
    } catch (err) {
      console.error('Error saving Trello integration:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration? Local tasks synced from this integration will remain but will not update.')) return;
    try {
      await deleteIntegration(id);
      await loadIntegrations();
    } catch (err) {
      console.error('Error deleting integration:', err);
    }
  };

  const handleSync = async (integrationId: string) => {
    setSyncLoadingId(integrationId);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId,
          userId: firebaseUser?.uid,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus({ id: integrationId, success: true, count: data.count });
        await loadIntegrations();
      } else {
        setSyncStatus({ id: integrationId, success: false, message: data.error || 'Sync failed' });
      }
    } catch (err: any) {
      setSyncStatus({ id: integrationId, success: false, message: err.message || 'Sync failed' });
    } finally {
      setSyncLoadingId(null);
    }
  };

  const planeInt = integrations.find((i) => i.provider === 'plane');
  const trelloInt = integrations.find((i) => i.provider === 'trello');

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          {currentWorkspaceId === 'personal'
            ? 'Connect your personal board to pull tasks into your private space.'
            : `Connect external workspaces to ${activeWorkspace?.name || 'team workspace'}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Plane.so Card */}
        <Card className={`border-border/50 shadow-md transition-all ${planeInt ? 'border-accent/20' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Plane.so</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Open-source issue tracker</p>
                </div>
              </div>
              <Badge variant={planeInt ? 'accent' : 'secondary'}>
                {planeInt ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {planeInt ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-sm space-y-2.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CloudLightning className="w-3.5 h-3.5" />
                    Host: <span className="font-semibold text-foreground">{planeInt.config.host}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5" />
                    Workspace: <span className="font-semibold text-foreground">{planeInt.config.workspaceSlug}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last Synced: <span className="font-semibold text-foreground">{formatDate(planeInt.lastSyncedAt)}</span>
                  </p>
                </div>

                {/* Sync status messages */}
                {syncStatus && syncStatus.id === planeInt.id && (
                  <div className={`text-xs p-3 rounded-lg flex items-start gap-2 ${
                    syncStatus.success ? 'bg-success/5 text-success' : 'bg-destructive/5 text-destructive'
                  }`}>
                    {syncStatus.success ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Successfully synced {syncStatus.count} tasks from Plane.so!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Sync failed: {syncStatus.message}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => handleSync(planeInt.id)}
                    className="flex-1 bg-accent text-white"
                    disabled={syncLoadingId === planeInt.id}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncLoadingId === planeInt.id ? 'animate-spin' : ''}`} />
                    {syncLoadingId === planeInt.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(planeInt.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    disabled={syncLoadingId === planeInt.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pull issues assigned to you or your team project on Plane.so into PeakFlow for AI coaching.
                </p>
                {activeForm !== 'plane' ? (
                  <Button onClick={() => setActiveForm('plane')} variant="outline" className="w-full">
                    Configure Plane.so
                  </Button>
                ) : (
                  <form onSubmit={handleSavePlane} className="space-y-4 pt-2 border-t border-border/40">
                    <div className="space-y-2">
                      <Label htmlFor="phost">Plane Host URL</Label>
                      <Input
                        id="phost"
                        value={planeHost}
                        onChange={(e) => setPlaneHost(e.target.value)}
                        placeholder="https://app.plane.so"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pkey">Developer API Key</Label>
                      <Input
                        id="pkey"
                        type="password"
                        value={planeApiKey}
                        onChange={(e) => setPlaneApiKey(e.target.value)}
                        placeholder="plane_api_key_..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="pwspace">Workspace Slug</Label>
                        <Input
                          id="pwspace"
                          value={planeWorkspace}
                          onChange={(e) => setPlaneWorkspace(e.target.value)}
                          placeholder="my-workspace"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pproject">Project Slug</Label>
                        <Input
                          id="pproject"
                          value={planeProject}
                          onChange={(e) => setPlaneProject(e.target.value)}
                          placeholder="my-project"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" variant="accent" className="flex-1" disabled={formLoading}>
                        {formLoading ? 'Connecting...' : 'Connect Workspace'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setActiveForm(null)} disabled={formLoading}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trello Card */}
        <Card className={`border-border/50 shadow-md transition-all ${trelloInt ? 'border-accent/20' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Trello</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Kanban board manager</p>
                </div>
              </div>
              <Badge variant={trelloInt ? 'accent' : 'secondary'}>
                {trelloInt ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {trelloInt ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-sm space-y-2.5">
                  {trelloInt.config.boardId && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5" />
                      Board ID: <span className="font-semibold text-foreground truncate max-w-[150px]">{trelloInt.config.boardId}</span>
                    </p>
                  )}
                  {trelloInt.config.listId && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" />
                      List ID: <span className="font-semibold text-foreground truncate max-w-[150px]">{trelloInt.config.listId}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Last Synced: <span className="font-semibold text-foreground">{formatDate(trelloInt.lastSyncedAt)}</span>
                  </p>
                </div>

                {/* Sync status messages */}
                {syncStatus && syncStatus.id === trelloInt.id && (
                  <div className={`text-xs p-3 rounded-lg flex items-start gap-2 ${
                    syncStatus.success ? 'bg-success/5 text-success' : 'bg-destructive/5 text-destructive'
                  }`}>
                    {syncStatus.success ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Successfully synced {syncStatus.count} cards from Trello!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Sync failed: {syncStatus.message}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => handleSync(trelloInt.id)}
                    className="flex-1 bg-accent text-white"
                    disabled={syncLoadingId === trelloInt.id}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${syncLoadingId === trelloInt.id ? 'animate-spin' : ''}`} />
                    {syncLoadingId === trelloInt.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(trelloInt.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    disabled={syncLoadingId === trelloInt.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect Trello lists or boards to sync cards automatically. Red/Urgent labels map to high impact scores.
                </p>
                {activeForm !== 'trello' ? (
                  <Button onClick={() => setActiveForm('trello')} variant="outline" className="w-full">
                    Configure Trello
                  </Button>
                ) : (
                  <form onSubmit={handleSaveTrello} className="space-y-4 pt-2 border-t border-border/40">
                    <div className="space-y-2">
                      <Label htmlFor="tkey">Trello Developer Key</Label>
                      <Input
                        id="tkey"
                        value={trelloKey}
                        onChange={(e) => setTrelloKey(e.target.value)}
                        placeholder="Developer Key"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ttoken">User Token</Label>
                      <Input
                        id="ttoken"
                        type="password"
                        value={trelloToken}
                        onChange={(e) => setTrelloToken(e.target.value)}
                        placeholder="User Token"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="tboard">Board ID</Label>
                        <Input
                          id="tboard"
                          value={trelloBoard}
                          onChange={(e) => setTrelloBoard(e.target.value)}
                          placeholder="Optional if List ID set"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tlist">List ID</Label>
                        <Input
                          id="tlist"
                          value={trelloList}
                          onChange={(e) => setTrelloList(e.target.value)}
                          placeholder="Optional if Board ID set"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" variant="accent" className="flex-1" disabled={formLoading}>
                        {formLoading ? 'Connecting...' : 'Connect Trello'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setActiveForm(null)} disabled={formLoading}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
