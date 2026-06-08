// ============================================================
// PeakFlow AI — Authentication Context
// ============================================================

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider } from '@/lib/firebase';
import { getUser, createUser } from '@/lib/firestore';
import type { User } from '@/types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (user: FirebaseUser) => {
    const data = await getUser(user.uid);
    setUserData(data);
    return data;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserData]);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
    const existing = await getUser(result.user.uid);
    if (!existing) {
      await createUser(result.user.uid, {
        name: result.user.displayName || 'User',
        email: result.user.email || '',
        profession: '',
        goal: '',
        onboardingCompleted: false,
      });
    }
    await fetchUserData(result.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    await fetchUserData(result.user);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await updateProfile(result.user, { displayName: name });
    await createUser(result.user.uid, {
      name,
      email,
      profession: '',
      goal: '',
      onboardingCompleted: false,
    });
    await fetchUserData(result.user);
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    setUserData(null);
  };

  const refreshUserData = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userData,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
