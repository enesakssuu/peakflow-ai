// ============================================================
// PeakFlow AI — Redesigned Generic Integrations Page
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
  HelpCircle,
  Sparkles
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
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  
  // Generic form values object
  const [formValues, setFormValues] = useState<Record<string, string>>({});

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
    setFormValues({});
  }, [targetId, loadIntegrations]);

  const handleInputChange = (fieldId: string, val: string) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  const handleSaveIntegration = async (e: React.FormEvent, providerId: string, fields: any[]) => {
    e.preventDefault();
    if (!targetId) return;

    // Validate fields are filled
    const configData: Record<string, string> = {};
    for (const f of fields) {
      const value = formValues[f.id] || f.defaultValue || '';
      if (f.required && !value) {
        showToast(isTr ? 'Lütfen tüm alanları doldurun!' : 'Please fill all required fields!');
        return;
      }
      configData[f.id] = value;
    }

    setFormLoading(true);
    try {
      await saveIntegration(targetId, targetType, providerId, configData);
      await loadIntegrations();
      setOpenFormId(null);
      setFormValues({});
      showToast(
        isTr 
          ? `${providerId.replace('_', ' ').toUpperCase()} bağlantısı başarıyla eklendi!` 
          : `${providerId.replace('_', ' ').toUpperCase()} connection added successfully!`
      );
    } catch (err) {
      console.error('Error saving integration:', err);
      showToast(isTr ? 'Bağlantı kaydedilemedi!' : 'Failed to save integration!');
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

  const formatDate = (date: Date | null) => {
    if (!date) return isTr ? 'Hiçbir zaman' : 'Never';
    return date.toLocaleString();
  };

  const providersList = [
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      desc: isTr 
        ? "Akıllı planlama önerileri için toplantılarınızı ve derin çalışma bloklarınızı senkronize edin." 
        : "Sync your meetings and deep work blocks for intelligent scheduling suggestions.",
      icon: Calendar,
      color: 'text-blue-500 bg-blue-500/10',
      fields: [
        { id: 'calendarId', label: isTr ? 'Takvim E-postası' : 'Calendar Email', placeholder: 'user@example.com', required: true }
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      desc: isTr 
        ? "Odaklanma Modu sırasında bildirimleri otomatik olarak susturun ve konuşmaları özetleyin." 
        : "Automatically silence notifications during Focus Mode and summarize missed conversations.",
      icon: SlackIcon,
      color: 'text-purple-500 bg-purple-500/10',
      fields: [
        { id: 'workspace', label: isTr ? 'Slack Çalışma Alanı Adı' : 'Slack Workspace Name', placeholder: 'my-team-workspace', required: true }
      ]
    },
    {
      id: 'notion',
      name: 'Notion',
      desc: isTr 
        ? "Yapay Zeka Koçunun proje belgelerine başvurmasına izin vermek için Notion sayfalarını bağlayın." 
        : "Connect your workspace to allow the AI Coach to reference project docs and notes.",
      icon: BookOpen,
      color: 'text-zinc-600 bg-zinc-500/10',
      fields: [
        { id: 'pageId', label: isTr ? 'Notion Sayfa ID' : 'Notion Page ID', placeholder: 'notion_page_...', required: true }
      ]
    },
    {
      id: 'trello',
      name: 'Trello',
      desc: isTr 
        ? "Kartları ve panoları otomatik olarak önceliklendirmek için Trello listelerini bağlayın." 
        : "Sync cards and boards to automatically prioritize your daily task list.",
      icon: Layers,
      color: 'text-blue-600 bg-blue-600/10',
      fields: [
        { id: 'appKey', label: 'Trello API Key', placeholder: 'API Key', required: true },
        { id: 'token', label: 'User Token', placeholder: 'Token', type: 'password', required: true },
        { id: 'boardId', label: 'Board ID (Optional)', placeholder: 'Board ID', required: false },
        { id: 'listId', label: 'List ID (Optional)', placeholder: 'List ID', required: false }
      ]
    },
    {
      id: 'jira',
      name: 'Jira',
      desc: isTr 
        ? "Aktif sprintleri ve hata raporlarını Odaklanma oturumu planlamanıza dahil edin." 
        : "Pull active sprints and issues into your Focus Session planning.",
      icon: Layers,
      color: 'text-blue-700 bg-blue-700/10',
      fields: [
        { id: 'projectKey', label: isTr ? 'Proje Anahtarı (Jira Key)' : 'Project Key', placeholder: 'PROJ-KEY', required: true }
      ]
    },
    {
      id: 'clickup',
      name: 'ClickUp',
      desc: isTr 
        ? "Yapay zeka odaklı haftalık analizler elde etmek için görevlerinizi ve hedeflerinizi merkezileştirin." 
        : "Centralize your tasks and goals for AI-driven weekly insights.",
      icon: CheckCircle,
      color: 'text-purple-600 bg-purple-600/10',
      fields: [
        { id: 'listId', label: isTr ? 'Liste ID (List ID)' : 'List ID', placeholder: 'clickup_list_...', required: true }
      ]
    },
    {
      id: 'gmail',
      name: 'Gmail',
      desc: isTr 
        ? "Yapay Zeka Koçunun yanıt taslakları hazırlamasına ve önemli e-postaları ortaya çıkarmasına izin verin." 
        : "Let the AI Coach draft replies and surface important emails during review periods.",
      icon: Mail,
      color: 'text-red-500 bg-red-500/10',
      fields: [
        { id: 'email', label: isTr ? 'Gmail Adresi' : 'Gmail Address', placeholder: 'user@gmail.com', required: true }
      ]
    },
    {
      id: 'plane',
      name: 'Plane.so',
      desc: isTr 
        ? "Plane.so üzerinde size atanan işleri veya takım projelerini PeakFlow'a aktarın." 
        : "Pull issues assigned to you or your team project on Plane.so into PeakFlow for AI coaching.",
      icon: Workflow,
      color: 'text-indigo-500 bg-indigo-500/10',
      fields: [
        { id: 'host', label: 'Plane Host', placeholder: 'https://app.plane.so', required: true, defaultValue: 'https://app.plane.so' },
        { id: 'apiKey', label: 'API Key', placeholder: 'plane_api_key_...', type: 'password', required: true },
        { id: 'workspaceSlug', label: 'Workspace Slug', placeholder: 'workspace-slug', required: true },
        { id: 'projectSlug', label: 'Project Slug', placeholder: 'project-slug', required: true }
      ]
    }
  ];

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
        
        {providersList.map((p) => {
          const matchedInt = integrations.find(i => i.provider === p.id);
          const Icon = p.icon;

          return (
            <div 
              key={p.id}
              className={`bg-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-full border ${
                matchedInt ? 'border-accent/30 bg-accent/[0.01]' : 'border-border/40'
              } relative overflow-hidden group`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${p.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {matchedInt ? (
                  <div className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    {isTr ? 'Bağlandı' : 'Connected'}
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-semibold">
                    {isTr ? 'Bağlı Değil' : 'Not Connected'}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-lg text-primary mb-2">{p.name}</h3>

              {/* Connected View */}
              {matchedInt && openFormId !== p.id && (
                <div className="flex flex-col flex-grow justify-between">
                  <div className="rounded-xl bg-secondary/50 p-4 border border-border/40 text-xs space-y-2 mb-6 flex-grow">
                    {Object.entries(matchedInt.config)
                      .filter(([key]) => key !== 'apiKey' && key !== 'token') // Hide secrets
                      .map(([key, val]) => (
                        <p key={key} className="text-muted-foreground flex items-center gap-1.5 truncate">
                          <span className="font-bold uppercase tracking-wider text-[9px] opacity-75">{key}:</span>
                          <span className="font-semibold text-foreground truncate">{String(val)}</span>
                        </p>
                      ))}
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{isTr ? 'Son Senkronizasyon:' : 'Last Synced:'} <span className="font-semibold text-foreground">{formatDate(matchedInt.lastSyncedAt)}</span></span>
                    </p>
                  </div>

                  {syncStatus && syncStatus.id === matchedInt.id && (
                    <div className={`text-xs p-3 rounded-lg flex items-start gap-2 mb-4 ${
                      syncStatus.success ? 'bg-success/5 text-success' : 'bg-destructive/5 text-destructive'
                    }`}>
                      {syncStatus.success ? (
                        <>
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{isTr ? `Başarıyla ${syncStatus.count} görev senkronize edildi!` : `Successfully synced ${syncStatus.count} tasks!`}</span>
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
                      onClick={() => handleSync(matchedInt.id)}
                      className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-10 font-bold"
                      disabled={syncLoadingId === matchedInt.id}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncLoadingId === matchedInt.id ? 'animate-spin' : ''}`} />
                      {syncLoadingId === matchedInt.id ? (isTr ? 'Eşleşiyor...' : 'Syncing...') : (isTr ? 'Eşle' : 'Sync')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(matchedInt.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 border-border/80 hover:border-destructive/30 rounded-xl w-10 h-10 p-0 shrink-0"
                      disabled={syncLoadingId === matchedInt.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Not Connected View */}
              {!matchedInt && openFormId !== p.id && (
                <div className="flex flex-col flex-grow justify-between">
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-grow">
                    {p.desc}
                  </p>
                  <button 
                    onClick={() => {
                      setOpenFormId(p.id);
                      setFormValues({});
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors cursor-pointer mt-auto"
                  >
                    {isTr ? `${p.name} Bağla` : `Connect ${p.name}`}
                  </button>
                </div>
              )}

              {/* Connection Form Inline */}
              {openFormId === p.id && (
                <form 
                  onSubmit={(e) => handleSaveIntegration(e, p.id, p.fields)} 
                  className="space-y-3 pt-2 border-t border-border/20 flex-grow flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {p.fields.map((f) => (
                      <div key={f.id} className="space-y-1">
                        <Label htmlFor={`${p.id}-${f.id}`} className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                          <span>{f.label}</span>
                          {f.required && <span className="text-red-500 font-normal">*</span>}
                        </Label>
                        <Input
                          id={`${p.id}-${f.id}`}
                          type={f.type || 'text'}
                          value={formValues[f.id] || ''}
                          onChange={(e) => handleInputChange(f.id, e.target.value)}
                          placeholder={f.placeholder}
                          className="h-9 text-xs"
                          required={f.required}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Button type="submit" variant="accent" className="flex-1 text-xs h-9 font-bold" disabled={formLoading}>
                      {formLoading ? (isTr ? 'Bağlanıyor...' : 'Connecting...') : (isTr ? 'Kaydet' : 'Connect')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-xs h-9 border border-border/40 hover:bg-secondary" 
                      onClick={() => setOpenFormId(null)} 
                      disabled={formLoading}
                    >
                      {isTr ? 'İptal' : 'Cancel'}
                    </Button>
                  </div>
                </form>
              )}

            </div>
          );
        })}

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
