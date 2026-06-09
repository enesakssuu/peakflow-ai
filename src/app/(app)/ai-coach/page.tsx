// ============================================================
// PeakFlow AI — AI Coach Page
// ============================================================

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Brain, 
  Target, 
  Clock, 
  Ban, 
  ArrowRight, 
  Send, 
  Plus, 
  Sparkles,
  Bot
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  time: string;
  action?: {
    text: string;
    href: string;
  };
  steps?: string[];
}

export default function AICoachPage() {
  const { language } = useLanguage();
  const isTr = language === 'tr';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: isTr 
        ? "Günaydın. Programınızı ve son odaklanma oturumlarınızı inceledim. Bu hafta bilişsel yükünüz normalden biraz daha yüksek görünüyor. Bugün zihninizi boşaltmanıza ve önceliklerinizi düzenlemenize nasıl yardımcı olabilirim?"
        : "Good morning. I've reviewed your schedule and your recent focus sessions. Your cognitive load seems slightly higher than usual this week. How can I help you clear the noise and organize your priorities today?",
      time: '9:00 AM'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Bento suggestions click handler
  const handleSuggestionClick = (prompt: string, type: 'focus' | 'week' | 'procrastinate') => {
    // 1. Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Simulated response
    setTimeout(() => {
      setIsTyping(false);
      let coachMsg: Message;

      if (type === 'focus') {
        coachMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'coach',
          text: isTr 
            ? "Mevcut görevlerinize göre, şu anki önceliğiniz API senkronizasyon rotalarını tamamlamak olmalıdır. Enerjiniz genellikle sabahları en yüksek seviyededir, bu nedenle hemen 25 dakikalık bir odaklanma oturumu başlatmanızı öneririm."
            : "Based on your tasks, your priority is to finalize the API sync routes. Your energy is typically highest in the morning, so I recommend starting a 25-minute focus session now.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: {
            text: isTr ? "Yeni Görev Oluştur" : "Create New Task",
            href: "/tasks?new=true"
          }
        };
      } else if (type === 'week') {
        coachMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'coach',
          text: isTr 
            ? "Bu haftayı rahatlatmak için planlı hareket edelim. Salı ve Perşembe günleri yoğun toplantılarınız var. Bu nedenle Çarşamba gününü 'Toplantısız Derin Çalışma Günü' olarak koruyalım ve en kritik 3 görevi oraya yerleştirelim."
            : "Let's structure your week to buffer heavy loads. Tuesday and Thursday are heavy with meetings, so protect Wednesday as a 'No-Meeting Deep Work Day' and schedule your top 3 tasks there.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      } else {
        coachMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'coach',
          text: isTr 
            ? "Belirsizlik, ertelemenin birincil tetikleyicisidir. Bilişsel engeli azaltmak için bunu küçük parçalara ayıralım. Q3 planlama belgesi örneğinde bilişsel yük yüksek olduğu için ertelemeye meyillisiniz:"
            : "Vagueness is a primary trigger for procrastination. Let's break this down to lower the cognitive barrier. You're putting off the Q3 planning document because the cognitive barrier is high:",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          steps: isTr 
            ? [
                "Bu belge için en önemli tek çıktıyı belirleyin. Tüm planı değil, sadece ana hedefi yazın.",
                "15 dakikalık 'sıfır beklenti' taslağı hazırlayın. Sadece maddeler halinde yazın, biçimlendirme yapmayın."
              ]
            : [
                "Define the single most important outcome for this document. Not the whole plan, just the core objective.",
                "Commit to a 15-minute 'zero-expectations' draft. Just write bullet points. No formatting."
              ],
          action: {
            text: isTr ? "Göreve Dönüştür ve Başla" : "Convert to Task & Start",
            href: "/tasks?new=true"
          }
        };
      }

      setMessages(prev => [...prev, coachMsg]);
    }, 1500);
  };

  // Custom message submit handler
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const coachMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'coach',
        text: isTr
          ? "Sizi çok iyi anlıyorum. Süreci adım adım organize edelim. Tükenmişliği önlemek ve momentumu korumak için, bu işi 15 dakikanın altındaki mikro-görevlere bölmenizi öneriyorum. İlk görev için bir odaklanma oturumu başlatmak ister misiniz?"
          : "I understand completely. Let's organize this step-by-step. To maintain momentum and avoid burnout, I recommend breaking this into micro-tasks of under 15 minutes each. Would you like to start a focus session for the first task?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: {
          text: isTr ? "Yeni Görev Ekle" : "Add New Task",
          href: "/tasks?new=true"
        }
      };
      setMessages(prev => [...prev, coachMsg]);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] relative overflow-hidden bg-background">
      
      {/* Header */}
      <header className="px-6 md:px-12 py-6 shrink-0 border-b border-border/40 bg-card/50 backdrop-blur-md z-10 sticky top-0 flex items-center justify-between">
        <div className="flex items-center gap-4 max-w-[800px]">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Brain className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-xl md:text-2xl text-foreground">
              {isTr ? "Yapay Zeka Yönetici Koçu" : "AI Executive Coach"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTr ? "Derin çalışma için sakin ve odaklanmış rehberlik." : "Calm, focused guidance for deep work."}
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 scroll-smooth pb-36" id="chat-container">
        <div className="max-w-[800px] mx-auto space-y-8">
          
          {messages.map((msg) => {
            const isCoach = msg.sender === 'coach';
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isCoach ? 'items-start max-w-[85%]' : 'items-end max-w-[85%] ml-auto'}`}
              >
                <div className={`p-6 rounded-2xl shadow-xs border ${
                  isCoach 
                    ? 'bg-card text-foreground rounded-tl-none border-border/50' 
                    : 'bg-secondary/40 text-foreground rounded-tr-none border-border/20'
                }`}>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Step instructions (erteleme card) */}
                  {msg.steps && (
                    <div className="mt-6 space-y-4">
                      {msg.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-muted-foreground">{step}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions inside message bubbles */}
                  {msg.action && (
                    <div className="mt-6 pt-4 border-t border-border/40 flex">
                      <Link 
                        href={msg.action.href}
                        className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 group"
                      >
                        {msg.action.text}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-2 px-1">
                  {isCoach ? (isTr ? 'Yapay Zeka Koçu' : 'PeakFlow AI') : (isTr ? 'Siz' : 'You')} • {msg.time}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="bg-card text-foreground p-5 rounded-2xl rounded-tl-none shadow-xs border border-border/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {/* Suggested Prompts (Bento Style) - Only shown if user hasn't asked anything or we can show them always as options */}
          {messages.length === 1 && !isTyping && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
              <button 
                onClick={() => handleSuggestionClick(
                  isTr ? "Bugün neye odaklanmalıyım?" : "What should I focus on today?", 
                  'focus'
                )}
                className="text-left bg-secondary/30 hover:bg-secondary/60 transition-colors p-6 rounded-2xl group border border-border/40 cursor-pointer"
              >
                <Target className="w-5 h-5 text-accent mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm text-foreground">
                  {isTr ? "Bugün neye odaklanmalıyım?" : "What should I focus on today?"}
                </p>
              </button>
              
              <button 
                onClick={() => handleSuggestionClick(
                  isTr ? "Haftamı nasıl organize etmeliyim?" : "How should I organize my week?", 
                  'week'
                )}
                className="text-left bg-secondary/30 hover:bg-secondary/60 transition-colors p-6 rounded-2xl group border border-border/40 cursor-pointer"
              >
                <Clock className="w-5 h-5 text-accent mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm text-foreground">
                  {isTr ? "Haftamı nasıl organize etmeliyim?" : "How should I organize my week?"}
                </p>
              </button>
              
              <button 
                onClick={() => handleSuggestionClick(
                  isTr ? "Neden sürekli erteliyorum?" : "Why am I procrastinating?", 
                  'procrastinate'
                )}
                className="text-left bg-secondary/30 hover:bg-secondary/60 transition-colors p-6 rounded-2xl group border border-border/40 cursor-pointer"
              >
                <Ban className="w-5 h-5 text-accent mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm text-foreground">
                  {isTr ? "Neden sürekli erteliyorum?" : "Why am I procrastinating?"}
                </p>
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-6 px-6 md:px-12 z-20">
        <form onSubmit={handleSend} className="max-w-[800px] mx-auto">
          <div className="bg-card rounded-2xl shadow-lg p-2.5 flex items-end border border-border/70 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
            <button 
              type="button"
              className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-xl hover:bg-secondary/50"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-base p-3 text-foreground placeholder:text-muted-foreground/60 min-h-[46px] max-h-32" 
              placeholder={isTr ? "Koçunuza danışın..." : "Ask your coach..."}
              rows={1}
            />
            
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:shadow-md hover:bg-primary/95 transition-all shrink-0 ml-2 mb-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-[11px] text-muted-foreground">
              {isTr 
                ? "PeakFlow AI hata yapabilir. Önemli bilgileri kontrol etmeyi unutmayın."
                : "PeakFlow AI can make mistakes. Consider verifying important information."}
            </p>
          </div>
        </form>
      </div>

    </div>
  );
}
