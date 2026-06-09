// ============================================================
// PeakFlow AI — Premium Animated Landing Page
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ArrowRight,
  Play,
  Brain,
  Link2,
  Sparkles,
  Check,
  CheckCircle2,
  SkipForward,
  Sun,
  Moon,
  Globe,
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  Grid,
  List,
  Table,
  Flame,
  ArrowUpRight,
  Sliders
} from 'lucide-react';

// Fade In Observer Component for scroll triggers
function FadeInOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-98'
      }`}
    >
      {children}
    </div>
  );
}

// Localized Content Dictionary
const dictionary = {
  en: {
    dashboard: "Dashboard",
    login: "Log In",
    signup: "Start Free",
    heroBadge: "Meet PeakFlow AI 2.0",
    heroTitle1: "Your work doesn't need more lists.",
    heroTitle2: "It needs better decisions.",
    heroDesc: "PeakFlow AI connects your task apps, tracks your energy patterns, and recommends exactly what to execute next. Complete deep work, prevent burnout.",
    watchDemo: "Watch Demo",
    interactiveHeader: "Click and explore the PeakFlow dashboard",
    coachCard: "Coach Insight",
    coachQuote: "I noticed your energy dips around 3:00 PM. Schedule light tasks for then, and execute this high-impact review now.",
    accept: "Accept Suggestion",
    skip: "Skip",
    trustedBy: "Empowering high-performance teams at",
    featuresTitle: "Choose Your Work Environment",
    personalTab: "Kişisel Alan (Personal Space)",
    teamTab: "Ekip Alanı (Team Workspace)",
    personalDesc: "Your single-player dashboard focused on cognitive training, daily momentum scoring, and energy-aware task recommendation.",
    teamDesc: "A multi-player ClickUp-like experience with dynamic custom columns, comments feed, subtask checklists, and alternative list/board views.",
    feature1Title: "1. Connect Ecosystem",
    feature1Desc: "Securely import tasks and cards from Plane, Trello, and your calendar in seconds.",
    feature2Title: "2. Cognitive Scoring",
    feature2Desc: "Our AI model calculates impact and duration against your daily energy levels.",
    feature3Title: "3. Direct Action",
    feature3Desc: "Receive direct focus suggestions. Protect your deep work, track your flow status.",
    integrationTitle: "Seamless Integrations",
    integrationDesc: "Bring all your issues, tickets, and boards into a unified decision dashboard.",
    ctaTitle: "Ready to reach Peak Flow?",
    ctaDesc: "Join thousands of developers, operators, and creators who let AI guide their focus daily.",
    exploreBtn: "Explore Features",
    copyright: "© 2026 PeakFlow AI. All rights reserved."
  },
  tr: {
    dashboard: "Kontrol Paneli",
    login: "Giriş Yap",
    signup: "Ücretsiz Başla",
    heroBadge: "PeakFlow AI 2.0 ile Tanışın",
    heroTitle1: "İşlerinizin daha fazla listeye değil,",
    heroTitle2: "daha iyi kararlara ihtiyacı var.",
    heroDesc: "PeakFlow AI görev araçlarınızı bağlar, enerji döngülerinizi takip eder ve bir sonraki adımda tam olarak neye odaklanmanız gerektiğini önerir.",
    watchDemo: "Demoyu İzle",
    interactiveHeader: "Tıklayın ve PeakFlow kontrol panelini keşfedin",
    coachCard: "Koç Önerisi",
    coachQuote: "Enerjinizin saat 15:00 civarında düştüğünü fark ettim. E-postaları o saate planlayın ve bu yüksek etkili analizi şimdi yapın.",
    accept: "Öneriyi Kabul Et",
    skip: "Atla",
    trustedBy: "Yüksek performanslı ekiplerin tercihi",
    featuresTitle: "Çalışma Alanınızı Seçin",
    personalTab: "Kişisel Alan (Personal Space)",
    teamTab: "Ekip Alanı (Team Workspace)",
    personalDesc: "Bilişsel performans takibi, günlük momentum skorları ve enerji odaklı görev önerileri sunan tek kişilik çalışma alanı.",
    teamDesc: "Dinamik özel sütunlar, yorum akışları, alt görev listeleri ve alternatif tablo/pano görünümleri sunan gelişmiş ekip çalışma panosu.",
    feature1Title: "1. Ekosistemi Bağla",
    feature1Desc: "Plane, Trello ve takviminizdeki görevleri saniyeler içinde güvenle çalışma alanınıza aktarın.",
    feature2Title: "2. Bilişsel Skorlama",
    feature2Desc: "Yapay zeka modelimiz, görevlerin etki puanı ve tahmini süresini günlük enerjinize göre puanlar.",
    feature3Title: "3. Doğrudan Eylem",
    feature3Desc: "Doğrudan odaklanma önerileri alın. Derin çalışmayı koruyun ve çalışma durumunuzu takip edin.",
    integrationTitle: "Kusursuz Entegrasyonlar",
    integrationDesc: "Tüm hata kayıtlarını, biletleri ve panoları tek bir akıllı karar merkezinde toplayın.",
    ctaTitle: "Zirve Performansa Ulaşmaya Hazır Mısınız?",
    ctaDesc: "Her gün odaklanmalarını yapay zeka önerileriyle yönlendiren binlerce geliştirici ve üretici arasına katılın.",
    exploreBtn: "Özellikleri Keşfet",
    copyright: "© 2026 PeakFlow AI. Tüm hakları saklıdır."
  }
};

export default function HomePage() {
  const { firebaseUser } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Dark/Light Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Interactive Demo state
  const [activeFeatureTab, setActiveFeatureTab] = useState<'personal' | 'team'>('personal');
  const [interactiveMomentum, setInteractiveMomentum] = useState(64);
  const [activeTaskTitle, setActiveTaskTitle] = useState('Brand Strategy Review');
  const [activeTaskDesc, setActiveTaskDesc] = useState('Evaluate visual assets and Q3 messaging guidelines.');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('peakflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('peakflow_theme', 'light');
    }
  };

  const currentCopy = dictionary[language] || dictionary.en;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative selection:bg-accent/20">
      
      {/* Background radial gradient highlights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-accent/5 rounded-full blur-[120px] animate-float-1 dark:bg-accent/3" />
        <div className="absolute top-1/3 left-10 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] animate-float-2 dark:bg-indigo-500/2" />
        <div className="absolute bottom-0 right-10 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[180px] animate-float-3 dark:bg-teal-500/3" />
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-6 md:px-12 h-20 w-full max-w-[1200px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/20 shadow-xs">
              <Zap className="w-5.5 h-5.5 text-accent animate-pulse-soft" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
              PeakFlow AI
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* TR / EN Switcher dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-secondary/20 text-xs font-semibold hover:border-accent/40 transition-all cursor-pointer">
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-card border border-border rounded-xl shadow-lg p-1 animate-scale-in min-w-[90px]">
                <button
                  onClick={() => setLanguage('tr')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer font-medium ${
                    language === 'tr' ? 'text-accent font-bold bg-accent/5' : ''
                  }`}
                >
                  Türkçe
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer font-medium ${
                    language === 'en' ? 'text-accent font-bold bg-accent/5' : ''
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/80 bg-secondary/20 hover:border-accent/40 transition-all cursor-pointer text-foreground"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            {/* Action Buttons */}
            {firebaseUser ? (
              <Link
                href="/dashboard"
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-accent/15 transition-all flex items-center gap-1.5"
              >
                {currentCopy.dashboard}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-bold text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  {currentCopy.login}
                </Link>
                <Link
                  href="/signup"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-accent/15 transition-all"
                >
                  {currentCopy.signup}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-10 space-y-32">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center pt-8 md:pt-16 space-y-8">
          {/* Animated Hero Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[11px] font-bold text-accent tracking-wider uppercase animate-fade-in-up">
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{currentCopy.heroBadge}</span>
          </div>

          {/* Core Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight max-w-[950px] animate-fade-in-up delay-100">
            {currentCopy.heroTitle1} <br />
            <span className="bg-gradient-to-r from-accent via-teal-400 to-indigo-500 bg-clip-text text-transparent">
              {currentCopy.heroTitle2}
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed animate-fade-in-up delay-200">
            {currentCopy.heroDesc}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center animate-fade-in-up delay-300">
            <Link
              href={firebaseUser ? "/dashboard" : "/signup"}
              className="bg-accent hover:bg-accent/95 text-accent-foreground rounded-xl px-8 py-3.5 font-extrabold text-sm shadow-lg shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 duration-200"
            >
              {currentCopy.signup}
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <button
              onClick={() => {
                const el = document.getElementById('interactive-demo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-transparent border border-border/80 text-foreground rounded-xl px-8 py-3.5 font-bold text-sm hover:bg-secondary/40 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 duration-200 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-muted-foreground" />
              {currentCopy.watchDemo}
            </button>
          </div>

          {/* Interactive Live Mockup Wow Section */}
          <div
            id="interactive-demo"
            className="w-full max-w-[900px] pt-12 animate-fade-in-up delay-400"
          >
            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 flex items-center justify-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {currentCopy.interactiveHeader}
              </span>
            </div>

            <div className="bg-card border border-border/60 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden group/dashboard text-left">
              {/* Glow filter behind dashboard mock */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/5 opacity-50 blur-[80px] rounded-full pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Panel: Recommendations & Focus suggestion */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{currentCopy.coachCard}</p>
                      <p className="text-[9px] text-muted-foreground">Today's Peak Performance suggestion</p>
                    </div>
                  </div>

                  {/* Active Card */}
                  <div className="bg-secondary/20 border border-border/40 rounded-2xl p-5 space-y-4 hover:border-accent/30 transition-all">
                    <div>
                      <h4 className="text-lg font-extrabold text-foreground transition-all">
                        {activeTaskTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {activeTaskDesc}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-3 border-t border-border/20">
                      <button
                        onClick={() => {
                          setInteractiveMomentum(prev => Math.min(100, prev + 8));
                          alert('Suggestion Applied! Check out how the momentum indicator updates.');
                        }}
                        className="text-xs font-bold text-accent flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {currentCopy.accept}
                      </button>
                      <button
                        onClick={() => {
                          setActiveTaskTitle('Write API Route Unit Tests');
                          setActiveTaskDesc('Build automated verification files for workspace invite route.');
                        }}
                        className="text-xs font-semibold text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        {currentCopy.skip}
                      </button>
                    </div>
                  </div>

                  {/* Interactive cards selector list */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { title: 'Brand Strategy Review', desc: 'Evaluate visual assets and Q3 messaging guidelines.' },
                      { title: 'Database Optimization', desc: 'Re-index tasks query limits for workspace lists.' },
                      { title: 'Write API Route Tests', desc: 'Build automated verification files for invite route.' }
                    ].map((t) => (
                      <button
                        key={t.title}
                        onClick={() => {
                          setActiveTaskTitle(t.title);
                          setActiveTaskDesc(t.desc);
                        }}
                        className={`text-left p-3 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                          activeTaskTitle === t.title
                            ? 'border-accent bg-accent/5 text-foreground'
                            : 'border-border hover:border-accent/30 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Right Panel: Momentum Indicator Ring */}
                <div className="flex flex-col items-center justify-center bg-secondary/10 border border-border/40 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground text-center">
                    Workspace Momentum
                  </span>
                  
                  {/* Circular progress */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full momentum-ring">
                      <circle className="track" cx="64" cy="64" r="54" />
                      <circle
                        className="progress"
                        cx="64"
                        cy="64"
                        r="54"
                        style={{
                          strokeDasharray: '339',
                          strokeDashoffset: `${339 - (339 * interactiveMomentum) / 100}`
                        }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-foreground">{interactiveMomentum}%</span>
                      <span className="text-[9px] font-bold text-accent uppercase mt-0.5 tracking-wider">Flowing</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                    <Flame className="w-3.5 h-3.5 text-warning fill-warning animate-pulse-soft" />
                    <span>On Fire 🔥</span>
                  </div>

                  {/* Manual mock session button */}
                  <button
                    onClick={() => setInteractiveMomentum(prev => Math.max(20, prev - 12))}
                    className="w-full h-7 rounded-lg bg-card border border-border text-[9.5px] font-bold text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all cursor-pointer"
                  >
                    Simulate Work Session
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* LOGO MARQUEE */}
        <section className="py-6 border-y border-border/30 bg-secondary/5 overflow-hidden rounded-2xl">
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              {currentCopy.trustedBy}
            </p>
            <div className="relative w-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
              
              <div className="flex gap-20 animate-marquee whitespace-nowrap opacity-40 grayscale hover:opacity-80 transition-opacity py-1">
                {['Acme Corp', 'GlobalTech', 'Nexus Systems', 'Lumina Co', 'Aether Inc', 'Apex Labs', 'Vortex Digital', 'Polaris Tech'].map((name, i) => (
                  <span key={i} className="text-sm font-black text-foreground tracking-wider uppercase">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DETAILED SPACE PRESENTATION SECTION */}
        <FadeInOnScroll>
          <section className="space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {currentCopy.featuresTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                PeakFlow AI bridges personal flow training and deep team collaboration.
              </p>
            </div>

            {/* Slider Tabs Switcher */}
            <div className="flex justify-center">
              <div className="flex bg-secondary/30 border border-border/40 p-1.5 rounded-2xl gap-2 w-fit">
                <button
                  onClick={() => setActiveFeatureTab('personal')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFeatureTab === 'personal'
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentCopy.personalTab}
                </button>
                <button
                  onClick={() => setActiveFeatureTab('team')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFeatureTab === 'team'
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {currentCopy.teamTab}
                </button>
              </div>
            </div>

            {/* Tab Display Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-secondary/10 border border-border/40 rounded-[32px] p-6 md:p-10">
              
              {/* Left Column: Text & Features list */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-foreground">
                    {activeFeatureTab === 'personal' ? 'Cognitive Workspace' : 'Multiplayer Workspace'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activeFeatureTab === 'personal' ? currentCopy.personalDesc : currentCopy.teamDesc}
                  </p>
                </div>

                <div className="space-y-3">
                  {activeFeatureTab === 'personal' ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Energy-Aware Suggested Focus</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Daily Reviews & Reflection logs</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Personal Momentum tracking (Flow Score)</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Kanban Board, Accordion List & Spreadsheet views</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Customizable Columns with color selectors</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-xs font-bold text-foreground">Slide-over Task drawers with subtask checklist</span>
                      </div>
                    </>
                  )}
                </div>

                <Link
                  href={firebaseUser ? "/dashboard" : "/signup"}
                  className="inline-flex items-center gap-2 bg-foreground text-background rounded-xl px-5 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <span>{currentCopy.signup}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right Column: Dynamic Mock UI Render */}
              <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-lg relative overflow-hidden aspect-video flex flex-col justify-between">
                {activeFeatureTab === 'personal' ? (
                  // Personal Mock UI
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/40 pb-2.5">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Peak Coaching Loop</span>
                      <Badge className="bg-accent/10 text-accent text-[9px] font-bold">1-Player</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-secondary/20 rounded-xl border border-border/30 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span>Focus Session</span>
                          <span className="text-accent flex items-center gap-1"><Clock className="w-3 h-3" /> 25:00</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Status: Running deep work timer on &quot;Write API tests&quot;</p>
                      </div>

                      <div className="p-3 bg-secondary/20 rounded-xl border border-border/30 text-[10px] text-muted-foreground leading-relaxed italic">
                        &quot;Your productivity energy score is High (8/10). Take advantage of this slot for complex programming tasks.&quot;
                      </div>
                    </div>
                  </div>
                ) : (
                  // Team Mock UI
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Ekip Panosu (Team Space)</span>
                      <div className="flex items-center gap-1">
                        <Grid className="w-3 h-3 text-accent" />
                        <List className="w-3.5 h-3.5 text-muted-foreground" />
                        <Table className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Columns Preview */}
                    <div className="grid grid-cols-3 gap-2 flex-1 items-center">
                      <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-2.5 space-y-1.5 h-full">
                        <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-widest">Todo</span>
                        <div className="bg-card border border-border/60 rounded p-1.5 text-[9px] font-bold shadow-xs">Setup Workspace</div>
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 space-y-1.5 h-full">
                        <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest">In Progress</span>
                        <div className="bg-card border border-border/60 rounded p-1.5 text-[9px] font-bold shadow-xs">Theme Toggle</div>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5 h-full">
                        <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest">QA/Testing</span>
                        <div className="bg-card border border-border/60 rounded p-1.5 text-[9px] font-bold shadow-xs">Build Checks</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>
        </FadeInOnScroll>

        {/* HOW IT WORKS LOOP */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {currentCopy.featuresTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              PeakFlow AI loops workspace telemetry to guide daily action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Link2 className="w-6 h-6 text-accent" />,
                title: currentCopy.feature1Title,
                desc: currentCopy.feature1Desc
              },
              {
                icon: <Brain className="w-6 h-6 text-accent" />,
                title: currentCopy.feature2Title,
                desc: currentCopy.feature2Desc
              },
              {
                icon: <Zap className="w-6 h-6 text-accent" />,
                title: currentCopy.feature3Title,
                desc: currentCopy.feature3Desc
              }
            ].map((step, index) => (
              <FadeInOnScroll key={index} delay={index * 150}>
                <div className="bg-card border border-border/50 rounded-2xl p-8 space-y-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/15">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </section>

        {/* INTEGRATIONS GRID */}
        <FadeInOnScroll>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-secondary/15 border border-border/40 rounded-[32px] p-6 md:p-10 overflow-hidden relative">
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/5 opacity-50 blur-[80px] rounded-full pointer-events-none" />

            <div className="space-y-5 max-w-md">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                {currentCopy.integrationTitle}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {currentCopy.integrationDesc}
              </p>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-secondary border border-border rounded-lg px-2.5 py-1 font-semibold">Trello</span>
                <span className="text-[10px] bg-secondary border border-border rounded-lg px-2.5 py-1 font-semibold">Plane</span>
                <span className="text-[10px] bg-secondary border border-border rounded-lg px-2.5 py-1 font-semibold">Calendars</span>
              </div>
            </div>

            {/* Integration visually simulated logs stack */}
            <div className="space-y-3">
              {[
                { source: 'Trello', title: 'Refactor login layouts', status: 'In Sync' },
                { source: 'Plane', title: 'Extend workspace database invites', status: 'Completed' },
                { source: 'Trello', title: 'Translate Turkish language dictionaries', status: 'In Sync' }
              ].map((item, idx) => (
                <div key={idx} className="bg-card border border-border/60 rounded-xl p-3.5 flex justify-between items-center shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[9px] uppercase font-extrabold tracking-wider bg-accent/10 text-accent px-2 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground flex-shrink-0 font-medium">{item.status}</span>
                </div>
              ))}
            </div>
          </section>
        </FadeInOnScroll>

        {/* CTA BOTTOM BANNER */}
        <FadeInOnScroll>
          <section className="bg-gradient-to-br from-accent/15 via-indigo-500/5 to-teal-500/5 border border-accent/20 rounded-[32px] p-8 md:p-16 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {currentCopy.ctaTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[500px] mx-auto leading-relaxed">
              {currentCopy.ctaDesc}
            </p>

            <div className="flex justify-center pt-2">
              <Link
                href={firebaseUser ? "/dashboard" : "/signup"}
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-8 py-3.5 font-extrabold text-sm shadow-lg shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 duration-200"
              >
                <span>{currentCopy.signup}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            </div>
          </section>
        </FadeInOnScroll>

      </main>

      {/* Premium Footer */}
      <footer className="border-t border-border/40 bg-card py-10">
        <div className="w-full max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-extrabold text-foreground text-sm">PeakFlow AI</span>
          </div>

          <div className="flex gap-6 text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors">Support</a>
          </div>

          <p className="text-xs text-muted-foreground">
            {currentCopy.copyright}
          </p>
        </div>
      </footer>

    </div>
  );
}
