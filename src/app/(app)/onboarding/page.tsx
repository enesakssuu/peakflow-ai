// ============================================================
// PeakFlow AI — Onboarding (3-step flow)
// ============================================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/lib/firestore';
import { createTask } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Target,
  Rocket,
  BookOpen,
  Heart,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const professions = [
  'Software Developer',
  'Designer',
  'Product Manager',
  'Data Scientist',
  'Marketing Manager',
  'Content Creator',
  'Founder / CEO',
  'Freelancer',
  'Student',
  'Other',
];

const goals = [
  { id: 'ship', label: 'Ship Faster', icon: Rocket, description: 'Build and launch products quickly' },
  { id: 'focus', label: 'Deep Focus', icon: Target, description: 'Minimize distractions, maximize output' },
  { id: 'balance', label: 'Work-Life Balance', icon: Heart, description: 'Stay productive without burnout' },
  { id: 'learn', label: 'Learn & Grow', icon: BookOpen, description: 'Continuous improvement and skill building' },
];

export default function OnboardingPage() {
  const { firebaseUser, refreshUserData } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const canProceed = () => {
    if (step === 0) return profession !== '' || customProfession !== '';
    if (step === 1) return goal !== '';
    if (step === 2) return taskTitle.trim() !== '';
    return false;
  };

  const handleComplete = async () => {
    if (!firebaseUser) return;
    setLoading(true);

    try {
      const finalProfession = profession === 'Other' ? customProfession : profession;

      // Update user profile
      await updateUser(firebaseUser.uid, {
        profession: finalProfession,
        goal,
        onboardingCompleted: true,
      });

      // Create first task
      if (taskTitle.trim()) {
        await createTask(firebaseUser.uid, {
          title: taskTitle.trim(),
          estimatedDuration: 30,
          impactScore: 4,
        });
      }

      await refreshUserData();
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                i === step ? 'w-8 bg-accent' : i < step ? 'w-2 bg-accent/50' : 'w-2 bg-border'
              )}
            />
          ))}
        </div>

        {/* Step 0: Profession */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-4">
                <Briefcase className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">What do you do?</h1>
              <p className="text-muted-foreground mt-2">
                This helps us tailor recommendations to your work style.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {professions.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProfession(p);
                    if (p !== 'Other') setCustomProfession('');
                  }}
                  className={cn(
                    'p-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-200 cursor-pointer',
                    profession === p
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-border hover:border-accent/30 hover:bg-secondary text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {profession === 'Other' && (
              <div className="mt-4 animate-fade-in">
                <Input
                  placeholder="What's your profession?"
                  value={customProfession}
                  onChange={(e) => setCustomProfession(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-4">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">What&apos;s your main goal?</h1>
              <p className="text-muted-foreground mt-2">
                We&apos;ll optimize your experience around this.
              </p>
            </div>

            <div className="space-y-3">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={cn(
                    'w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 cursor-pointer',
                    goal === g.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/30 hover:bg-secondary'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      goal === g.id ? 'bg-accent/15' : 'bg-secondary'
                    )}
                  >
                    <g.icon
                      className={cn(
                        'w-5 h-5',
                        goal === g.id ? 'text-accent' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div>
                    <p className={cn('font-medium text-sm', goal === g.id && 'text-accent')}>
                      {g.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                  </div>
                  {goal === g.id && (
                    <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: First task */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-4">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                What&apos;s the most important thing to do today?
              </h1>
              <p className="text-muted-foreground mt-2">
                Just one thing. What would make today a win?
              </p>
            </div>

            <Card className="border-border/50">
              <CardContent className="p-6">
                <Input
                  placeholder="e.g., Finish the landing page design"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-base h-12"
                  autoFocus
                />
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~30 min estimated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>High impact</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="accent"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : step === 2 ? (
              <>
                Let&apos;s Go
                <Rocket className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
