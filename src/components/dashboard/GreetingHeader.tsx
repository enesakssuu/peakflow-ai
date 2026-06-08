// ============================================================
// PeakFlow AI — Greeting Header
// ============================================================

'use client';

import React from 'react';

interface GreetingHeaderProps {
  name: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function GreetingHeader({ name }: GreetingHeaderProps) {
  const firstName = name?.split(' ')[0] || 'there';

  return (
    <div className="mb-8 animate-fade-in">
      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
        {getGreeting()}, {firstName}
      </h1>
      <p className="text-muted-foreground mt-1 text-base">
        {getDateString()} — Let&apos;s make it count.
      </p>
    </div>
  );
}
