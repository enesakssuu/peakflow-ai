// ============================================================
// PeakFlow AI — Root Page (redirect to dashboard or login)
// ============================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { firebaseUser, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.push('/login');
    } else if (userData && !userData.onboardingCompleted) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  }, [firebaseUser, userData, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading PeakFlow AI...</p>
      </div>
    </div>
  );
}
