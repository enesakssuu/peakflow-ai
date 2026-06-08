// ============================================================
// PeakFlow AI — Daily Reflection Page
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDailyReview, getDailyReviews } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Heart,
  Sparkles,
  CheckCircle2,
  Battery,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export default function ReflectionPage() {
  const { firebaseUser } = useAuth();
  const [energy, setEnergy] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [win, setWin] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReflected, setAlreadyReflected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if already reflected today
  const checkTodayReflection = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const reviews = await getDailyReviews(firebaseUser.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasToday = reviews.some((r) => {
        const reviewDate = new Date(r.createdAt);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === today.getTime();
      });
      setAlreadyReflected(hasToday);
    } catch (error) {
      console.error('Error checking reflection:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    checkTodayReflection();
  }, [checkTodayReflection]);

  const handleSubmit = async () => {
    if (!firebaseUser) return;
    setLoading(true);

    try {
      await createDailyReview({
        userId: firebaseUser.uid,
        energy,
        productivity,
        win: win.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEnergyLabel = (value: number): string => {
    if (value <= 2) return 'Very Low';
    if (value <= 4) return 'Low';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'High';
    return 'Peak Energy';
  };

  const getProductivityLabel = (value: number): string => {
    if (value <= 2) return 'Minimal';
    if (value <= 4) return 'Below Average';
    if (value <= 6) return 'Average';
    if (value <= 8) return 'Productive';
    return 'Highly Productive';
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted || alreadyReflected) {
    return (
      <div className="container-narrow py-12">
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Reflection Complete</h1>
          <p className="text-muted-foreground">
            {alreadyReflected && !submitted
              ? "You've already reflected today. Come back tomorrow!"
              : 'Great job taking time to reflect. See you tomorrow!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Reflection</h1>
            <p className="text-muted-foreground text-sm">
              How did today go? Take a moment to check in.
            </p>
          </div>
        </div>
      </div>

      {/* Energy Level */}
      <Card className="animate-fade-in-up delay-100">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Battery className="w-4 h-4 text-warning" />
            Energy Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{energy}</span>
              <span className="text-sm text-muted-foreground">
                {getEnergyLabel(energy)}
              </span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={(val) => setEnergy(val[0])}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Level */}
      <Card className="animate-fade-in-up delay-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4 text-accent" />
            Productivity Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{productivity}</span>
              <span className="text-sm text-muted-foreground">
                {getProductivityLabel(productivity)}
              </span>
            </div>
            <Slider
              value={[productivity]}
              onValueChange={(val) => setProductivity(val[0])}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Unproductive</span>
              <span>Peak Output</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biggest Win */}
      <Card className="animate-fade-in-up delay-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-success" />
            Biggest Win
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What was your biggest accomplishment today?"
            value={win}
            onChange={(e) => setWin(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="animate-fade-in-up delay-400 pb-8">
        <Button
          variant="accent"
          size="lg"
          className="w-full h-12"
          onClick={handleSubmit}
          disabled={loading || !win.trim()}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Save Reflection
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
