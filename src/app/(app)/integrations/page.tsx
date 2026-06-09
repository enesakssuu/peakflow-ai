// ============================================================
// PeakFlow AI — Integrations Page
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getIntegrations, saveIntegration, deleteIntegration } from '@/lib/firestore';
import {
  Calendar,
  MessageSquare as SlackIcon,
  BookOpen,
  Mail,
  Layers,
  CheckCircle,
  Plus,
  Brain,
  Check,
  AlertCircle,
  Clock,
  Workflow,
  RefreshCw,
  Trash2,
  Lock,
  Globe,
  Settings,
  HelpCircle
} from 'lucide-react';
import type { Integration } from '@/types';

export default function IntegrationsPage() {
  const { firebaseUser } = useAuth();
  const { currentWorkspaceId, activeWorkspace } = useWorkspace();
  const { language } = useLanguage();
  const isTr = language === 'tr';

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms expanding inside cards
  const [openFormId, setOpenFormId] = useState<'plane' | 'trello' | null>(null);
  
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

  // Status variables
  const [formLoading, setFormLoading] = useState(false);
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ id: string; success: boolean; count?: number; message?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setOpenFormId(null);
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
      setOpenFormId(null);
      setPlaneApiKey('');
      showToast(isTr ? 'Plane.so başarıyla bağlandı!' : 'Plane.so connected successfully!');
    } catch (err) {
      console.error('Error saving Plane integration:', err);
      showToast(isTr ? 'Bağlantı hatası!' : 'Connection error!');
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
      setOpenFormId(null);
      setTrelloToken('');
      showToast(isTr ? 'Trello başarıyla bağlandı!' : 'Trello connected successfully!');
    } catch (err) {
      console.error('Error saving Trello integration:', err);
      showToast(isTr ? 'Bağlantı hatası!' : 'Connection error!');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMsg = isTr 
      ? 'Bu bağlantıyı kesmek istediğinizden emin misiniz? Senkronize edilen mevcut kartlar silinmeyecektir.'
      : 'Are you sure you want to disconnect this integration? Local tasks synced from this integration will remain but will not update.';
    if (!confirm(confirmMsg)) return;

    try {
      await deleteIntegration(id);
      await loadIntegrations();
      showToast(isTr ? 'Bağlantı başarıyla kesildi.' : 'Integration disconnected successfully.');
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const planeInt = integrations.find((i) => i.provider === 'plane');
  const trelloInt = integrations.find((i) => i.provider === 'trello');

  const formatDate = (date: Date | null) => {
    if (!date) return isTr ? 'Hiçbir zaman' : 'Never';
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">
          {isTr ? 'Bağlantılar yükleniyor...' : 'Loading integrations...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in-up pb-16">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg border border-accent/20 animate-scale-in text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/20 pb-6">
        <div>
          <h2 className="font-extrabold text-3xl md:text-4xl tracking-tight text-foreground">
            {isTr ? "Bağlantılar" : "Integrations"}
          </h2>
          <p className="font-medium text-sm text-muted-foreground mt-2 max-w-2xl">
            {isTr
              ? "Yapay Zeka Çalışma Koçunuza Bilişsel Netlik kazandırmak amacıyla en sevdiğiniz araçları bağlayın."
              : "Connect your favorite tools to give your AI Work Coach the context it needs to help you achieve Cognitive Clarity."}
          </p>
        </div>
        
        {/* Contextual Coach Insight */}
        <div className="flex items-center gap-2.5 bg-card/60 border border-border/50 px-4 py-2.5 rounded-full shadow-xs shrink-0 self-start md:self-auto">
          <Brain className="w-4.5 h-4.5 text-accent" />
          <span className="text-xs font-semibold text-foreground">
            {isTr ? "Takvim bağlamak yapay zeka planlamasını %40 hızlandırır" : "Connecting Calendar boosts AI scheduling by 40%"}
          </span>
        </div>
      </header>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Google Calendar (Mock Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-105"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-primary">
              <Calendar className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              {isTr ? 'Bağlandı' : 'Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Google Calendar</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Akıllı planlama önerileri için toplantılarınızı ve derin çalışma bloklarınızı senkronize edin."
              : "Sync your meetings and deep work blocks for intelligent scheduling suggestions."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50 cursor-pointer">
            {isTr ? "Ayarları Yönet" : "Manage Settings"}
          </button>
        </div>

        {/* Slack (Mock Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-105"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-primary">
              <SlackIcon className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              {isTr ? 'Bağlandı' : 'Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Slack</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Odaklanma Modu sırasında bildirimleri otomatik olarak susturun ve kaçırılan konuşmaları özetleyin."
              : "Automatically silence notifications during Focus Mode and summarize missed conversations."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50 cursor-pointer">
            {isTr ? "Ayarları Yönet" : "Manage Settings"}
          </button>
        </div>

        {/* Trello (Real Functional) */}
        <div className={`bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border ${
          trelloInt ? 'border-accent/30 bg-accent/[0.01]' : 'border-border/40'
        } relative overflow-hidden group`}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-primary">
              <Layers className="w-6 h-6 text-foreground" />
            </div>
            {trelloInt ? (
              <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                {isTr ? 'Bağlandı' : 'Connected'}
              </div>
            ) : (
              <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
                {isTr ? 'Bağlı Değil' : 'Not Connected'}
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Trello</h3>

          {/* Connected View */}
          {trelloInt && openFormId !== 'trello' && (
            <div className="flex flex-col flex-grow">
              <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-xs space-y-2 mb-6 flex-grow">
                {trelloInt.config.boardId && (
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 shrink-0" />
                    Board ID: <span className="font-semibold text-foreground truncate max-w-[120px]">{trelloInt.config.boardId}</span>
                  </p>
                )}
                {trelloInt.config.listId && (
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    List ID: <span className="font-semibold text-foreground truncate max-w-[120px]">{trelloInt.config.listId}</span>
                  </p>
                )}
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {isTr ? 'Son Senkronizasyon:' : 'Last Synced:'} <span className="font-semibold text-foreground">{formatDate(trelloInt.lastSyncedAt)}</span>
                </p>
              </div>

              {syncStatus && syncStatus.id === trelloInt.id && (
                <div className={`text-xs p-3 rounded-lg flex items-start gap-2 mb-4 ${
                  syncStatus.success ? 'bg-success/5 text-success' : 'bg-destructive/5 text-destructive'
                }`}>
                  {syncStatus.success ? (
                    <>
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{isTr ? `Trello'dan ${syncStatus.count} kart başarıyla senkronize edildi!` : `Successfully synced ${syncStatus.count} cards from Trello!`}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{isTr ? `Senkronizasyon hatası: ${syncStatus.message}` : `Sync failed: ${syncStatus.message}`}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto">
                <Button
                  onClick={() => handleSync(trelloInt.id)}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-10 font-bold"
                  disabled={syncLoadingId === trelloInt.id}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncLoadingId === trelloInt.id ? 'animate-spin' : ''}`} />
                  {syncLoadingId === trelloInt.id ? (isTr ? 'Eşleşiyor...' : 'Syncing...') : (isTr ? 'Şimdi Eşle' : 'Sync Now')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(trelloInt.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-border/80 hover:border-destructive/30 rounded-xl w-10 h-10 p-0"
                  disabled={syncLoadingId === trelloInt.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Not Connected View */}
          {!trelloInt && openFormId !== 'trello' && (
            <div className="flex flex-col flex-grow">
              <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
                {isTr 
                  ? "Kartları ve panoları otomatik olarak önceliklendirmek için Trello listelerini veya panolarını bağlayın."
                  : "Sync cards and boards to automatically prioritize your daily task list."}
              </p>
              <button 
                onClick={() => setOpenFormId('trello')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto"
              >
                {isTr ? "Trello'yu Bağla" : "Connect Trello"}
              </button>
            </div>
          )}

          {/* Connection Form Inline */}
          {openFormId === 'trello' && (
            <form onSubmit={handleSaveTrello} className="space-y-3.5 pt-2 border-t border-border/20 flex-grow flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label htmlFor="tkey" className="text-xs font-bold text-muted-foreground">Trello API Key</Label>
                  <Input
                    id="tkey"
                    value={trelloKey}
                    onChange={(e) => setTrelloKey(e.target.value)}
                    placeholder="Developer API Key"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ttoken" className="text-xs font-bold text-muted-foreground">User Token</Label>
                  <Input
                    id="ttoken"
                    type="password"
                    value={trelloToken}
                    onChange={(e) => setTrelloToken(e.target.value)}
                    placeholder="User token key"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="tboard" className="text-xs font-bold text-muted-foreground">Board ID</Label>
                    <Input
                      id="tboard"
                      value={trelloBoard}
                      onChange={(e) => setTrelloBoard(e.target.value)}
                      placeholder="Optional"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tlist" className="text-xs font-bold text-muted-foreground">List ID</Label>
                    <Input
                      id="tlist"
                      value={trelloList}
                      onChange={(e) => setTrelloList(e.target.value)}
                      placeholder="Optional"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 mt-auto">
                <Button type="submit" variant="accent" className="flex-1 text-xs h-9 font-bold" disabled={formLoading}>
                  {formLoading ? (isTr ? 'Bağlanıyor...' : 'Connecting...') : (isTr ? 'Kaydet' : 'Connect')}
                </Button>
                <Button type="button" variant="ghost" className="text-xs h-9 border border-border/40 hover:bg-secondary" onClick={() => setOpenFormId(null)} disabled={formLoading}>
                  {isTr ? 'İptal' : 'Cancel'}
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Notion (Mock Not Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-on-surface-variant">
              <BookOpen className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
              {isTr ? 'Bağlı Değil' : 'Not Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Notion</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Yapay Zeka Koçunun proje belgelerine ve notlara başvurmasına izin vermek için çalışma alanınızı bağlayın."
              : "Connect your workspace to allow the AI Coach to reference project docs and notes."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto">
            {isTr ? "Notion'ı Bağla" : "Connect Notion"}
          </button>
        </div>

        {/* Jira (Mock Not Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-on-surface-variant">
              <Layers className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
              {isTr ? 'Bağlı Değil' : 'Not Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Jira</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Aktif sprintleri ve hata raporlarını Odaklanma oturumu planlamanıza dahil edin."
              : "Pull active sprints and issues into your Focus Session planning."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto">
            {isTr ? "Jira'yı Bağla" : "Connect Jira"}
          </button>
        </div>

        {/* ClickUp (Mock Not Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-on-surface-variant">
              <CheckCircle className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
              {isTr ? 'Bağlı Değil' : 'Not Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">ClickUp</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Yapay zeka odaklı haftalık analizler elde etmek için görevlerinizi ve hedeflerinizi merkezileştirin."
              : "Centralize your tasks and goals for AI-driven weekly insights."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto">
            {isTr ? "ClickUp'ı Bağla" : "Connect ClickUp"}
          </button>
        </div>

        {/* Gmail (Mock Not Connected) */}
        <div className="bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border border-border/40 hover:border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-105"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-primary">
              <Mail className="w-6 h-6 text-foreground" />
            </div>
            <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
              {isTr ? 'Bağlı Değil' : 'Not Connected'}
            </div>
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Gmail</h3>
          <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
            {isTr 
              ? "Yapay Zeka Koçunun yanıt taslakları hazırlamasına ve inceleme süreleri boyunca önemli e-postaları ortaya çıkarmasına izin verin."
              : "Let the AI Coach draft replies and surface important emails during review periods."}
          </p>
          <button className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto">
            {isTr ? "Gmail'i Bağla" : "Connect Gmail"}
          </button>
        </div>

        {/* Plane.so (Real Functional) */}
        <div className={`bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border ${
          planeInt ? 'border-accent/30 bg-accent/[0.01]' : 'border-border/40'
        } relative overflow-hidden group`}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center text-primary">
              <Workflow className="w-6 h-6 text-foreground" />
            </div>
            {planeInt ? (
              <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                {isTr ? 'Bağlandı' : 'Connected'}
              </div>
            ) : (
              <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
                {isTr ? 'Bağlı Değil' : 'Not Connected'}
              </div>
            )}
          </div>
          <h3 className="font-bold text-lg text-primary mb-2">Plane.so</h3>

          {/* Connected View */}
          {planeInt && openFormId !== 'plane' && (
            <div className="flex flex-col flex-grow">
              <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-xs space-y-2 mb-6 flex-grow">
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  Host: <span className="font-semibold text-foreground truncate max-w-[120px]">{planeInt.config.host}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 shrink-0" />
                  Workspace: <span className="font-semibold text-foreground truncate max-w-[120px]">{planeInt.config.workspaceSlug}</span>
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {isTr ? 'Son Senkronizasyon:' : 'Last Synced:'} <span className="font-semibold text-foreground">{formatDate(planeInt.lastSyncedAt)}</span>
                </p>
              </div>

              {syncStatus && syncStatus.id === planeInt.id && (
                <div className={`text-xs p-3 rounded-lg flex items-start gap-2 mb-4 ${
                  syncStatus.success ? 'bg-success/5 text-success' : 'bg-destructive/5 text-destructive'
                }`}>
                  {syncStatus.success ? (
                    <>
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{isTr ? `Plane.so'dan ${syncStatus.count} görev başarıyla senkronize edildi!` : `Successfully synced ${syncStatus.count} tasks from Plane.so!`}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{isTr ? `Senkronizasyon hatası: ${syncStatus.message}` : `Sync failed: ${syncStatus.message}`}</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto">
                <Button
                  onClick={() => handleSync(planeInt.id)}
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-10 font-bold"
                  disabled={syncLoadingId === planeInt.id}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncLoadingId === planeInt.id ? 'animate-spin' : ''}`} />
                  {syncLoadingId === planeInt.id ? (isTr ? 'Eşleşiyor...' : 'Syncing...') : (isTr ? 'Şimdi Eşle' : 'Sync Now')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(planeInt.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-border/80 hover:border-destructive/30 rounded-xl w-10 h-10 p-0"
                  disabled={syncLoadingId === planeInt.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Not Connected View */}
          {!planeInt && openFormId !== 'plane' && (
            <div className="flex flex-col flex-grow">
              <p className="text-sm text-muted-foreground flex-grow mb-6 leading-relaxed">
                {isTr 
                  ? "Plane.so üzerinde size atanan işleri veya takım projelerini koçluk için PeakFlow'a aktarın."
                  : "Pull issues assigned to you or your team project on Plane.so into PeakFlow for AI coaching."}
              </p>
              <button 
                onClick={() => setOpenFormId('plane')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto"
              >
                {isTr ? "Plane'i Bağla" : "Connect Plane.so"}
              </button>
            </div>
          )}

          {/* Connection Form Inline */}
          {openFormId === 'plane' && (
            <form onSubmit={handleSavePlane} className="space-y-3 pt-2 border-t border-border/20 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="phost" className="text-xs font-bold text-muted-foreground">Plane Host</Label>
                  <Input
                    id="phost"
                    value={planeHost}
                    onChange={(e) => setPlaneHost(e.target.value)}
                    placeholder="https://app.plane.so"
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pkey" className="text-xs font-bold text-muted-foreground">API Key</Label>
                  <Input
                    id="pkey"
                    type="password"
                    value={planeApiKey}
                    onChange={(e) => setPlaneApiKey(e.target.value)}
                    placeholder="plane_api_key_..."
                    className="h-8.5 text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="pwspace" className="text-xs font-bold text-muted-foreground">Workspace Slug</Label>
                    <Input
                      id="pwspace"
                      value={planeWorkspace}
                      onChange={(e) => setPlaneWorkspace(e.target.value)}
                      placeholder="workspace-slug"
                      className="h-8.5 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pproject" className="text-xs font-bold text-muted-foreground">Project Slug</Label>
                    <Input
                      id="pproject"
                      value={planeProject}
                      onChange={(e) => setPlaneProject(e.target.value)}
                      placeholder="project-slug"
                      className="h-8.5 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 mt-auto">
                <Button type="submit" variant="accent" className="flex-1 text-xs h-9 font-bold" disabled={formLoading}>
                  {formLoading ? (isTr ? 'Bağlanıyor...' : 'Connecting...') : (isTr ? 'Kaydet' : 'Connect')}
                </Button>
                <Button type="button" variant="ghost" className="text-xs h-9 border border-border/40 hover:bg-secondary" onClick={() => setOpenFormId(null)} disabled={formLoading}>
                  {isTr ? 'İptal' : 'Cancel'}
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Missing a tool? / Request New */}
        <div className="bg-card/40 border-2 border-dashed border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-card hover:border-accent/40 transition-colors cursor-pointer min-h-[260px] group">
          <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground mb-4 group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 text-foreground" />
          </div>
          <h3 className="font-bold text-base text-primary mb-1">
            {isTr ? "Eksik bir araç mı var?" : "Missing a tool?"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isTr
              ? "İş akışınız için bir sonraki adımda hangi bağlantıya ihtiyacınız olduğunu bize bildirin."
              : "Let us know what integration you need next for your workflow."}
          </p>
        </div>

      </div>
    </div>
  );
}
