// ============================================================
// PeakFlow AI — App Layout (authenticated routes)
// ============================================================

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.push('/login');
      return;
    }

    // Redirect to onboarding if not completed (unless already on onboarding)
    if (userData && !userData.onboardingCompleted && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [firebaseUser, userData, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  // Onboarding page — no sidebar
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Focus page — no sidebar (distraction-free)
  if (pathname.startsWith('/focus')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
