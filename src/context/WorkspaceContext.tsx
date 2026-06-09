// ============================================================
// PeakFlow AI — Workspace Context
// ============================================================

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceMembers,
  removeWorkspaceMember,
  createInvitation,
  getUserInvitations,
  updateInvitationStatus,
} from '@/lib/firestore';
import type { Workspace, WorkspaceMember, WorkspaceInvitation } from '@/types';

interface WorkspaceContextType {
  currentWorkspaceId: string; // 'personal' or workspaceId
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  pendingInvitations: WorkspaceInvitation[];
  loading: boolean;
  switchWorkspace: (id: string) => void;
  createTeamWorkspace: (name: string) => Promise<string>;
  inviteUser: (email: string, role: 'admin' | 'member') => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  refreshWorkspaceData: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Switch workspace selection and store it in localStorage for session persistence
  const switchWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peakflow_current_workspace_id', id);
    }
  }, []);

  // Fetch workspaces & pending invitations for the current user
  const fetchUserWorkspaceList = useCallback(async () => {
    if (!firebaseUser) {
      setWorkspaces([]);
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const wList = await getWorkspaces(firebaseUser.uid);
      setWorkspaces(wList);

      if (firebaseUser.email) {
        const inviteList = await getUserInvitations(firebaseUser.email);
        setPendingInvitations(inviteList);
      }
    } catch (err) {
      console.error('Error fetching workspace list:', err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Fetch members of the current selected workspace
  const fetchCurrentWorkspaceDetails = useCallback(async () => {
    if (currentWorkspaceId === 'personal' || !firebaseUser) {
      setMembers([]);
      return;
    }

    try {
      const mList = await getWorkspaceMembers(currentWorkspaceId);
      setMembers(mList);
    } catch (err) {
      console.error('Error fetching workspace members:', err);
    }
  }, [currentWorkspaceId, firebaseUser]);

  // Combined refresh helper
  const refreshWorkspaceData = useCallback(async () => {
    setLoading(true);
    await fetchUserWorkspaceList();
    await fetchCurrentWorkspaceDetails();
    setLoading(false);
  }, [fetchUserWorkspaceList, fetchCurrentWorkspaceDetails]);

  // Sync workspace list on auth state change
  useEffect(() => {
    if (firebaseUser) {
      // Restore selected workspace from localStorage if it exists
      if (typeof window !== 'undefined') {
        const savedId = localStorage.getItem('peakflow_current_workspace_id');
        if (savedId) {
          setCurrentWorkspaceId(savedId);
        }
      }
      refreshWorkspaceData();
    } else {
      setCurrentWorkspaceId('personal');
      setWorkspaces([]);
      setMembers([]);
      setPendingInvitations([]);
      setLoading(false);
    }
  }, [firebaseUser, refreshWorkspaceData]);

  // Sync members list when workspace selection changes
  useEffect(() => {
    fetchCurrentWorkspaceDetails();
  }, [currentWorkspaceId, fetchCurrentWorkspaceDetails]);

  // Create a new team workspace
  const createTeamWorkspace = async (name: string): Promise<string> => {
    if (!firebaseUser || !userData) throw new Error('Unauthenticated');
    const wId = await createWorkspace(name, firebaseUser.uid, userData.name, userData.email);
    await refreshWorkspaceData();
    // Switch to the newly created workspace
    switchWorkspace(wId);
    return wId;
  };

  // Invite a user to the current workspace
  const inviteUser = async (email: string, role: 'admin' | 'member') => {
    if (currentWorkspaceId === 'personal' || !firebaseUser || !userData) {
      throw new Error('No active team workspace to invite users to');
    }
    const activeW = workspaces.find((w) => w.id === currentWorkspaceId);
    if (!activeW) throw new Error('Workspace not found');

    await createInvitation(
      currentWorkspaceId,
      activeW.name,
      email,
      firebaseUser.uid,
      userData.name,
      role
    );
  };

  // Remove a member from the workspace
  const removeMember = async (userId: string) => {
    if (currentWorkspaceId === 'personal') return;
    await removeWorkspaceMember(currentWorkspaceId, userId);
    await fetchCurrentWorkspaceDetails();
  };

  // Accept a pending invitation
  const acceptInvite = async (inviteId: string) => {
    if (!firebaseUser || !userData) return;
    await updateInvitationStatus(inviteId, 'accepted', firebaseUser.uid, userData.name, userData.email);
    await refreshWorkspaceData();
  };

  // Decline a pending invitation
  const declineInvite = async (inviteId: string) => {
    if (!firebaseUser || !userData) return;
    await updateInvitationStatus(inviteId, 'declined', firebaseUser.uid, userData.name, userData.email);
    await refreshWorkspaceData();
  };

  const activeWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        activeWorkspace,
        workspaces,
        members,
        pendingInvitations,
        loading,
        switchWorkspace,
        createTeamWorkspace,
        inviteUser,
        removeMember,
        acceptInvite,
        declineInvite,
        refreshWorkspaceData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
