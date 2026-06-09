// ============================================================
// PeakFlow AI — Language & Translation Context
// ============================================================

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { updateUser } from '@/lib/firestore';
import tr from '@/locales/tr.json';
import en from '@/locales/en.json';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const dictionaries = { tr, en };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData, refreshUserData } = useAuth();
  const [language, setLanguageState] = useState<Language>('tr'); // Default to Turkish

  // Sync language selection from user database profile or local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('peakflow_language') as Language | null;
      if (stored && (stored === 'tr' || stored === 'en')) {
        setLanguageState(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (userData?.language && (userData.language === 'tr' || userData.language === 'en')) {
      setLanguageState(userData.language as Language);
      if (typeof window !== 'undefined') {
        localStorage.setItem('peakflow_language', userData.language);
      }
    }
  }, [userData]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peakflow_language', lang);
    }
    if (firebaseUser) {
      try {
        await updateUser(firebaseUser.uid, { language: lang } as any);
        await refreshUserData();
      } catch (err) {
        console.error('Failed to sync language setting with Firestore:', err);
      }
    }
  };

  // Translation helper function
  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const dict = dictionaries[language] as Record<string, any>;
    const keys = key.split('.');
    
    let value: any = dict;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to raw key if translation key doesn't exist
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Interpolate variables if provided (e.g. {count} -> 5)
    let result = value;
    if (variables) {
      Object.entries(variables).forEach(([vKey, vVal]) => {
        result = result.replace(new RegExp(`{${vKey}}`, 'g'), String(vVal));
      });
    }

    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
