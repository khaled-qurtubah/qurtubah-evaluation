'use client';

import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============ Progress Milestones Component ============
export function ProgressMilestones({ progress }: { progress: number }) {
  const milestones = [
    { pct: 25, emoji: '🎯', label: 'البداية', desc: '25%' },
    { pct: 50, emoji: '📈', label: 'منتصف الطريق', desc: '50%' },
    { pct: 75, emoji: '🏆', label: 'شارفت على الانتهاء', desc: '75%' },
    { pct: 100, emoji: '✅', label: 'الإنجاز الكامل', desc: '100%' },
  ];

  const nextMilestone = milestones.find((m) => m.pct > progress);
  const remaining = nextMilestone ? nextMilestone.pct - progress : 0;

  return (
    <Card className="mb-8 border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            معالم التقدم
          </CardTitle>
          {nextMilestone && (
            <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
              <TrendingUp className="h-3 w-3" />
              {remaining}% متبقي للمعلم التالي
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar with milestone markers */}
        <div className="relative mb-6">
          <div className="h-3 rounded-full bg-sky-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-sky-500 to-sky-700 transition-all duration-1000 progress-shimmer"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Milestone markers */}
          {milestones.map((m) => {
            const achieved = progress >= m.pct;
            return (
              <div
                key={m.pct}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${m.pct}%` }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                  achieved
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110 milestone-achieved'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500'
                }`}>
                  {achieved ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestone labels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const achieved = progress >= m.pct;
            return (
              <div
                key={m.pct}
                className={`text-center p-3 rounded-xl transition-all duration-300 ${
                  achieved
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <p className={`text-xs font-medium mt-1 ${achieved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {m.label}
                </p>
                <p className={`text-[10px] mt-0.5 ${achieved ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Next milestone info */}
        {nextMilestone && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <span className="text-xl">{nextMilestone.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">المعلم التالي: {nextMilestone.label}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{remaining}% متبقي للوصول إلى {nextMilestone.desc}</p>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{progress}%</span>
              <span className="text-xs text-amber-500">/{nextMilestone.pct}%</span>
            </div>
          </div>
        )}
        {!nextMilestone && progress >= 100 && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">تهانينا! تم تحقيق جميع معالم التقدم</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
