// ============================================================
// PeakFlow AI — Sidebar Navigation
// ============================================================

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ListTodo,
  Heart,
  BarChart3,
  LogOut,
  Zap,
  Menu,
  X,
  Settings,
  Link2,
  Users,
  Plus,
  ChevronsUpDown,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const pathname = usePathname();
  const { userData, signOut } = useAuth();
  const { currentWorkspaceId, workspaces, switchWorkspace, activeWorkspace } = useWorkspace();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = currentWorkspaceId === 'personal'
    ? [
        { href: '/dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
        { href: '/tasks', label: t('sidebar.tasks'), icon: ListTodo },
        { href: '/reflection', label: t('sidebar.reflection'), icon: Heart },
        { href: '/insights', label: t('sidebar.insights'), icon: BarChart3 },
        { href: '/integrations', label: t('sidebar.integrations'), icon: Link2 },
        { href: '/profile', label: t('sidebar.profile'), icon: User },
      ]
    : [
        { href: '/team-dashboard', label: t('sidebar.team_dashboard'), icon: LayoutDashboard },
        { href: '/tasks', label: t('sidebar.workspace_tasks'), icon: ListTodo },
        { href: '/workspace', label: t('sidebar.workspace_settings'), icon: Settings },
        { href: '/integrations', label: t('sidebar.workspace_sync'), icon: Link2 },
        { href: '/profile', label: t('sidebar.profile'), icon: User },
      ];

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm">
            {currentWorkspaceId === 'personal' ? 'PeakFlow' : activeWorkspace?.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0 lg:z-30',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">PeakFlow</h2>
              <p className="text-[11px] text-muted-foreground -mt-0.5">AI Work Coach</p>
            </div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 py-3 relative" ref={switcherRef}>
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border hover:border-accent/40 bg-secondary/50 text-left text-sm font-medium transition-all"
          >
            <span className="truncate flex items-center gap-2">
              {currentWorkspaceId === 'personal' ? (
                <>
                  <Users className="w-4 h-4 text-accent shrink-0" />
                  {t('sidebar.personal_space')}
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-success shrink-0" />
                  {activeWorkspace?.name}
                </>
              )}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>

          {/* Switcher Dropdown */}
          {switcherOpen && (
            <div className="absolute top-[calc(100%-4px)] left-4 right-4 z-50 bg-card border border-border shadow-xl rounded-xl p-1.5 animate-scale-in text-sm">
              <button
                onClick={() => {
                  switchWorkspace('personal');
                  setSwitcherOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors',
                  currentWorkspaceId === 'personal'
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'hover:bg-secondary text-foreground'
                )}
              >
                <Users className="w-4 h-4 shrink-0" />
                {t('sidebar.personal_space')}
              </button>

              <div className="border-t border-border/50 my-1" />

              <div className="max-h-36 overflow-y-auto">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      switchWorkspace(w.id);
                      setSwitcherOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors truncate',
                      currentWorkspaceId === w.id
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'hover:bg-secondary text-foreground'
                    )}
                  >
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    {w.name}
                  </button>
                ))}
              </div>

              {workspaces.length > 0 && <div className="border-t border-border/50 my-1" />}

              <Link
                href="/workspace"
                onClick={() => setSwitcherOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                {t('sidebar.create_team_workspace')}
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-[18px] h-[18px]', isActive && 'text-accent')} />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 pb-8 lg:pb-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent">
              {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userData?.name || 'User'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{userData?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('sidebar.sign_out')}
          </Button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border">
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                  isActive ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
