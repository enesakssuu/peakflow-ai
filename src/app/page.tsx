// ============================================================
// PeakFlow AI — Landing Page (Root Route)
// ============================================================

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Zap, 
  ArrowRight, 
  Play, 
  Brain, 
  Link2, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  SkipForward 
} from 'lucide-react';

export default function HomePage() {
  const { firebaseUser } = useAuth();

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-secondary-container selection:text-secondary-fixed">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-20 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/10">
        <div className="flex justify-between items-center px-6 md:px-12 h-20 w-full max-w-[1120px] mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">PeakFlow AI</span>
          </div>

          <div className="flex items-center gap-4">
            {firebaseUser ? (
              <Link 
                href="/dashboard"
                className="bg-accent text-accent-foreground rounded-[16px] px-6 py-2.5 font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="font-medium text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="bg-accent text-accent-foreground rounded-[16px] px-6 py-2.5 font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6 md:px-12 w-full max-w-[1120px] mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-[850px] leading-tight tracking-tight mb-6">
            Your work doesn't need more organization. It needs <span className="text-accent">better decisions</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[620px] mb-8 leading-relaxed">
            PeakFlow AI analyzes your tasks, energy, and schedule to tell you exactly what to focus on next.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
            <Link 
              href={firebaseUser ? "/dashboard" : "/signup"}
              className="bg-accent text-accent-foreground rounded-[16px] px-8 py-3.5 font-medium text-base hover:shadow-lg hover:shadow-accent/10 transition-shadow flex items-center justify-center gap-2"
            >
              Start Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button 
              className="bg-transparent border border-border text-foreground rounded-[16px] px-8 py-3.5 font-medium text-base hover:bg-secondary/40 transition-colors flex items-center justify-center gap-2"
              onClick={() => alert("Demo video is coming soon!")}
            >
              <Play className="w-5 h-5 fill-current text-muted-foreground" />
              Watch Demo
            </button>
          </div>

          {/* Hero Visual: AI Recommendation Card */}
          <div className="w-full max-w-[800px] bg-card rounded-[24px] p-8 md:p-10 border border-border/50 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500 ease-out text-left">
            {/* Subtle glow effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 opacity-40 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-widest">AI Recommendation</p>
                <p className="text-xs text-muted-foreground">Suggested focus right now</p>
              </div>
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 relative z-10">
              Brand Strategy Review
            </h3>
            <p className="text-base md:text-lg text-muted-foreground max-w-[600px] mb-6 relative z-10 leading-relaxed">
              Because your energy is peak and this is your highest impact lever right now.
            </p>
            
            <div className="flex items-center gap-4 relative z-10 border-t border-border/30 pt-6">
              <Link
                href={firebaseUser ? "/dashboard" : "/login"}
                className="text-sm font-semibold text-accent flex items-center gap-1.5 hover:text-accent/80 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept Suggestion
              </Link>
              <button 
                className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 hover:text-foreground transition-colors"
                onClick={() => alert("Please sign in to interact with the workspace.")}
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 border-y border-border/30 bg-secondary/10">
          <div className="w-full max-w-[1120px] mx-auto px-6 md:px-12 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">Trusted by high-impact operators at</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 opacity-50 grayscale">
              <span className="text-lg md:text-xl font-bold text-foreground">Acme Corp</span>
              <span className="text-lg md:text-xl font-bold text-foreground tracking-tighter">GlobalTech</span>
              <span className="text-lg md:text-xl font-bold text-foreground italic">Nexus</span>
              <span className="text-lg md:text-xl font-light text-foreground">Lumina</span>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 px-6 md:px-12 w-full max-w-[1120px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">The Intelligence Loop</h2>
            <p className="text-base text-muted-foreground max-w-[500px] mx-auto">Three steps to cognitive clarity and peak productivity.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-card rounded-[24px] p-8 border border-border/40 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center text-foreground mb-6">
                <Link2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">1. Connect</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sync your calendar, task manager, and communication tools. We map your entire ecosystem securely.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-card rounded-[24px] p-8 border border-border/40 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center text-foreground mb-6">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">2. AI Analyzes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our engine evaluates urgency, impact, and your historical energy patterns to find the hidden signals.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-card rounded-[24px] p-8 border border-accent/20 shadow-md ring-1 ring-accent/5">
              <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">3. We Decide</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You receive clear, actionable directives. Stop organizing lists and start executing what matters.
              </p>
            </div>
          </div>
        </section>

        {/* AI Coaching Section (Asymmetric Layout) */}
        <section className="py-24 px-6 md:px-12 w-full max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual with floating overlay */}
            <div className="order-2 lg:order-1 relative h-[450px] md:h-[500px] w-full rounded-[24px] overflow-hidden shadow-2xl group">
              <img 
                alt="Minimalist digital workspace environment" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2UKjbzk1H5VvJ-dEpYs0usRaTtuhRK16syEuhrXS5AVxxEbOI_L5SCk8mtUUD5cC1SrHdvbb22g1v7q8WPPq8hXpHbuUt_VcLPYwcm46ZJOIKqO6YEd2WtKHWBD7CmCVPJm03ml1qloFE21P_4BwtSpFCVgYP82VfZI6R0oEFNasUPp3fA7ziwKWFo0jEa86cfP7vShIquGnwf-ruSb9dbqhfWsMsA61LjXHL34Jk-N01F4KIC9ILgOu31io8m5MSn6ekaQFDSGkJ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent z-10" />
              
              {/* Floating Coach Insight Card */}
              <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 bg-background/80 backdrop-blur-md rounded-[24px] p-6 border border-white/10 z-20">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Coach Insight</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "I noticed you're trying to write the Q3 report. Your energy usually dips around 3:00 PM. Batch these emails for then, and focus on the report now."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content info */}
            <div className="order-1 lg:order-2 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                Your private coach for cognitive performance.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
                PeakFlow AI doesn't just sort tasks; it actively coaches you to better habits. By understanding context and capacity, it helps you protect your most valuable asset: deep focus.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent" />
                  </div>
                  Energy-aware scheduling
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent" />
                  </div>
                  Context-switching reduction
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent" />
                  </div>
                  Proactive burnout prevention
                </li>
              </ul>

              <button 
                className="bg-accent text-accent-foreground rounded-[16px] px-6 py-3 font-medium text-sm hover:shadow-md transition-shadow"
                onClick={() => alert("Additional features are available after signup!")}
              >
                Explore Features
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card w-full border-t border-border/40 mt-24">
        <div className="w-full py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center max-w-[1120px] mx-auto gap-6 relative z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-bold text-foreground">PeakFlow AI</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-xs text-muted-foreground hover:text-accent transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-muted-foreground hover:text-accent transition-colors" href="#">Terms of Service</a>
            <a className="text-xs text-muted-foreground hover:text-accent transition-colors" href="#">Contact</a>
          </div>
          
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © 2026 PeakFlow AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
