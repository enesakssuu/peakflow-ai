// ============================================================
// PeakFlow AI — Profile Settings Page
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Check, AlertCircle, Globe, Award, Target, MessageSquare } from 'lucide-react';
import { isUsernameAvailable, updateUser } from '@/lib/firestore';

export default function ProfilePage() {
  const { firebaseUser, userData, refreshUserData } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [profession, setProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [langSelect, setLangSelect] = useState<'tr' | 'en'>('tr');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setUsername(userData.username || '');
      setProfession(userData.profession || '');
      setGoal(userData.goal || '');
      setLangSelect((userData.language as 'tr' | 'en') || language);
    }
  }, [userData, language]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    const cleanUsername = username.trim().toLowerCase().replace(/\s/g, '');

    // Validate username if entered
    if (cleanUsername) {
      const regex = /^[a-z0-9_]{3,15}$/;
      if (!regex.test(cleanUsername)) {
        setError(t('profile.username_error_format'));
        setLoading(false);
        return;
      }

      // Check username availability if it changed
      if (cleanUsername !== userData?.username) {
        const isAvailable = await isUsernameAvailable(cleanUsername);
        if (!isAvailable) {
          setError(t('profile.username_error_taken'));
          setLoading(false);
          return;
        }
      }
    }

    try {
      await updateUser(firebaseUser.uid, {
        name: name.trim(),
        username: cleanUsername,
        profession: profession.trim(),
        goal: goal.trim(),
        language: langSelect,
      } as any);

      // Force language context to update immediately
      if (langSelect !== language) {
        await setLanguage(langSelect);
      }

      await refreshUserData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t('profile.desc')}</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            {t('sidebar.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="prof-name">{t('profile.name_label')}</Label>
              <Input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="prof-user">{t('profile.username_label')}</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-muted-foreground font-semibold">@</span>
                <Input
                  id="prof-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="username"
                  disabled={loading}
                  className="pl-7.5 h-11 font-medium"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('profile.username_desc')}
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="prof-lang" className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-muted-foreground" />
                {t('profile.language_label')}
              </Label>
              <select
                id="prof-lang"
                value={langSelect}
                onChange={(e) => setLangSelect(e.target.value as 'tr' | 'en')}
                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm font-medium transition-all focus:border-accent outline-none cursor-pointer"
                disabled={loading}
              >
                <option value="tr">Türkçe (Turkish)</option>
                <option value="en">English (English)</option>
              </select>
            </div>

            {/* Profession */}
            <div className="space-y-2">
              <Label htmlFor="prof-profession" className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-muted-foreground" />
                {t('profile.profession_label')}
              </Label>
              <Input
                id="prof-profession"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="prof-goal" className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-muted-foreground" />
                {t('profile.goal_label')}
              </Label>
              <Input
                id="prof-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            {/* Feedback messages */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/5 px-4 py-3 rounded-lg flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="text-sm text-success bg-success/5 px-4 py-3 rounded-lg flex items-center gap-2">
                <Check className="w-4.5 h-4.5 shrink-0" />
                <span>{t('profile.success_save')}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="accent"
              className="w-full h-11 font-semibold cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('profile.save_btn')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
