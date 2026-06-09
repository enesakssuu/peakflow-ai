// ============================================================
// PeakFlow AI — Standalone Pricing Page
// ============================================================

'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Check, CheckCircle2, Globe, Bell, User as UserIcon, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const { language, setLanguage } = useLanguage();
  const isTr = language === 'tr';

  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    setNotification(
      isTr 
        ? `${planName} planı başarıyla seçildi! Detaylar için yönlendiriliyorsunuz.`
        : `Successfully selected the ${planName} plan! Redirecting for setup.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col antialiased relative selection:bg-accent/20">
      
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-10 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Top Header */}
      <header className="bg-card/70 backdrop-blur-md sticky top-0 z-50 border-b border-border/40 relative">
        <div className="flex justify-between items-center px-6 md:px-12 h-20 w-full max-w-[1120px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center border border-accent/20">
              <Zap className="w-5 h-5 text-accent animate-pulse-soft" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
              PeakFlow AI
            </span>
          </Link>

          {/* Right Header Navigation controls */}
          <div className="flex items-center gap-4 text-foreground">
            {/* TR / EN Switcher dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-secondary/20 text-xs font-semibold hover:border-accent/40 transition-all cursor-pointer">
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{language}</span>
              </button>
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block min-w-[90px] z-50">
                <div className="bg-card border border-border rounded-xl shadow-lg p-1 animate-scale-in">
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
            </div>

            <button 
              aria-label="Notifications" 
              className="p-2 hover:text-accent transition-colors rounded-full hover:bg-secondary/40 border border-transparent hover:border-border/30"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
            <Link 
              href="/dashboard"
              aria-label="Account" 
              className="p-2 hover:text-accent transition-colors rounded-full hover:bg-secondary/40 border border-transparent hover:border-border/30"
            >
              <UserIcon className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1120px] mx-auto px-6 md:px-12 py-16 flex flex-col gap-16 relative z-10">
        
        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg border border-accent/20 animate-scale-in text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-accent" />
            <span>{notification}</span>
          </div>
        )}

        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary leading-tight">
            {isTr ? "Zihinsel Netliğe Yatırım Yapın" : "Invest in Cognitive Clarity"}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {isTr 
              ? "Odaklanma yolculuğunuzu en iyi destekleyen planı seçin. Gizli ücretler yok, sadece saf üretkenlik."
              : "Choose the plan that best supports your focus journey. No hidden fees, just pure productivity."}
          </p>
        </section>

        {/* Pricing Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
          
          {/* Free Plan */}
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 shadow-md border border-border/50 transition-all hover:shadow-lg hover:border-border duration-200">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-primary">{isTr ? "Ücretsiz" : "Free"}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary">$0</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground min-h-[40px]">
                {isTr ? "Enerjinizi yönetmeye başlamak için temel araçlar." : "Essential tools to start managing your energy."}
              </p>
            </div>
            
            <hr className="border-border/40" />

            <ul className="flex flex-col gap-4 flex-grow">
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Temel Yapay Zeka Koçu" : "Core AI Coach"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Haftada 3 Odaklanma Oturumu" : "3 Focus Sessions/week"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Temel Analizler" : "Basic Insights"}</span>
              </li>
            </ul>

            <button 
              onClick={() => handleSelectPlan('Free')}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-foreground bg-secondary hover:bg-secondary/80 transition-colors border border-border/80 cursor-pointer mt-auto"
            >
              {isTr ? "Başlarken" : "Get Started"}
            </button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 shadow-xl border-2 border-accent relative transform md:-translate-y-4 z-10 transition-all duration-200">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase whitespace-nowrap shadow-md">
              {isTr ? "En Popüler" : "Most Popular"}
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-primary">{isTr ? "Pro" : "Pro"}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary">$15</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground min-h-[40px]">
                {isTr ? "Derin çalışma profesyonelleri için gelişmiş yapay zeka özellikleri." : "Advanced AI features for deep work professionals."}
              </p>
            </div>

            <hr className="border-border/40" />

            <ul className="flex flex-col gap-4 flex-grow">
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">{isTr ? "Sınırsız Yapay Zeka Kararları" : "Unlimited AI Decisions"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">{isTr ? "Enerji Analizi" : "Energy Analysis"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">{isTr ? "Derin Çalışma Entegrasyonları" : "Deep Work Integrations"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">{isTr ? "Öncelikli Destek" : "Priority Support"}</span>
              </li>
            </ul>

            <button 
              onClick={() => handleSelectPlan('Pro')}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-accent-foreground bg-accent hover:bg-accent/90 transition-colors shadow-md shadow-accent/15 cursor-pointer mt-auto"
            >
              {isTr ? "Pro'ya Yükselt" : "Upgrade to Pro"}
            </button>
          </div>

          {/* Team Plan */}
          <div className="bg-card rounded-2xl p-8 flex flex-col gap-6 shadow-md border border-border/50 transition-all hover:shadow-lg hover:border-border duration-200">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-primary">{isTr ? "Ekip" : "Team"}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary">$49</span>
                <span className="text-sm text-muted-foreground">/user/mo</span>
              </div>
              <p className="text-sm text-muted-foreground min-h-[40px]">
                {isTr ? "Zihinsel netliği tüm organizasyonunuza yayın." : "Scale cognitive clarity across your organization."}
              </p>
            </div>

            <hr className="border-border/40" />

            <ul className="flex flex-col gap-4 flex-grow">
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Pro'daki Her Şey" : "Everything in Pro"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Ekip Analizleri" : "Team Insights"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Ortaklaşa Odaklanma Modu" : "Collaborative Focus"}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{isTr ? "Yönetici Kontrolleri" : "Admin Controls"}</span>
              </li>
            </ul>

            <button 
              onClick={() => handleSelectPlan('Team')}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-foreground bg-secondary hover:bg-secondary/80 transition-colors border border-border/80 cursor-pointer mt-auto"
            >
              {isTr ? "Satışla İletişime Geçin" : "Contact Sales"}
            </button>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border/40 w-full mt-auto relative z-10">
        <div className="w-full py-10 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center max-w-[1120px] mx-auto gap-6 md:gap-0">
          <div className="text-lg font-black tracking-tight text-primary">
            PeakFlow AI
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {isTr ? "Gizlilik Politikası" : "Privacy Policy"}
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {isTr ? "Kullanım Şartları" : "Terms of Service"}
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              {isTr ? "İletişim" : "Contact"}
            </a>
          </div>
          <div className="text-xs text-muted-foreground">
            © 2026 PeakFlow AI. {isTr ? "Tüm hakları saklıdır." : "All rights reserved."}
          </div>
        </div>
      </footer>
    </div>
  );
}
