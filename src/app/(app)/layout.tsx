// ============================================================
// PeakFlow AI — App Layout (authenticated routes)
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isUsernameAvailable, updateUser } from '@/lib/firestore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

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

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = usernameInput.trim().toLowerCase();
    
    // Validation
    const regex = /^[a-z0-9_]{3,15}$/;
    if (!regex.test(cleanVal)) {
      setUsernameError('Kullanıcı adı 3-15 karakter arasında olmalı, sadece küçük harf, rakam ve alt çizgi (_) içermelidir.');
      return;
    }

    setUsernameLoading(true);
    setUsernameError('');
    try {
      const isAvailable = await isUsernameAvailable(cleanVal);
      if (!isAvailable) {
        setUsernameError('Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.');
        setUsernameLoading(false);
        return;
      }

      await updateUser(firebaseUser!.uid, { username: cleanVal });
      await refreshUserData();
    } catch (err: any) {
      setUsernameError(err.message || 'Kullanıcı adı kaydedilemedi.');
    } finally {
      setUsernameLoading(false);
    }
  };

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

  const showUsernameModal = userData && userData.onboardingCompleted && !userData.username;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Username Selection Dialog */}
      {showUsernameModal && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent 
            className="sm:max-w-md [&>button]:hidden" 
            onPointerDownOutside={(e) => e.preventDefault()} 
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>⚡</span> Benzersiz Kullanıcı Adı Seçin
              </DialogTitle>
              <DialogDescription>
                Ekip davetlerini e-posta yerine kullanıcı adınızla almak ve göndermek için benzersiz bir kullanıcı adı belirleyin.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveUsername} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username-input">Kullanıcı Adı</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground font-semibold">@</span>
                  <Input
                    id="username-input"
                    placeholder="kullanici_adi"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="pl-7 h-11"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sadece küçük harf, rakam ve alt çizgi (_) kullanabilirsiniz. (Örn: @enes_aksu)
                </p>
              </div>

              {usernameError && (
                <div className="text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg leading-normal">
                  {usernameError}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button 
                  type="submit" 
                  variant="accent" 
                  className="w-full h-11 cursor-pointer" 
                  disabled={usernameLoading || !usernameInput.trim()}
                >
                  {usernameLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Kaydet ve Devam Et'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
