'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Trophy, Star, Target, Award, Zap, Shield, Flame,
  Lock, Unlock,
} from 'lucide-react';
import type { FieldWithDetails, ProgressData } from './types';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  condition: (data: { fields: FieldWithDetails[]; progress: ProgressData | null }) => boolean;
  color: string;
  bgColor: string;
}

const BADGES: Badge[] = [
  {
    id: 'first_evidence',
    name: 'البداية',
    description: 'إضافة أول شاهد',
    icon: <Zap className="h-5 w-5" />,
    condition: ({ fields }) => fields.some((f) => f.standards.some((s) => s.indicators.some((i) => i.evidences.length > 0))),
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'half_way',
    name: 'نصف الطريق',
    description: 'وصول الإنجاز إلى 50%',
    icon: <Target className="h-5 w-5" />,
    condition: ({ progress }) => (progress?.progress ?? 0) >= 50,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'domain_complete',
    name: 'مجال مكتمل',
    description: 'إكمال مجال كامل بنسبة 100%',
    icon: <Shield className="h-5 w-5" />,
    condition: ({ fields }) => fields.some((f) => f.progress === 100),
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'first_approved',
    name: 'شاهد معتمد',
    description: 'اعتماد أول شاهد',
    icon: <Award className="h-5 w-5" />,
    condition: ({ fields }) => fields.some((f) => f.standards.some((s) => s.indicators.some((i) => i.evidences.some((e) => e.status === 'approved')))),
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'persistent',
    name: 'المثابر',
    description: 'تقديم جميع الشواهد',
    icon: <Flame className="h-5 w-5" />,
    condition: ({ fields }) => {
      const allEvidence = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((i) => i.evidences)));
      return allEvidence.length > 0 && allEvidence.every((e) => e.status === 'submitted' || e.status === 'approved');
    },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  },
  {
    id: 'expert',
    name: 'الخبير',
    description: 'اعتماد جميع الشواهد',
    icon: <Star className="h-5 w-5" />,
    condition: ({ fields }) => {
      const allEvidence = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((i) => i.evidences)));
      return allEvidence.length > 0 && allEvidence.every((e) => e.status === 'approved');
    },
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'completionist',
    name: 'المُتقن',
    description: 'إكمال جميع المؤشرات بنسبة 100%',
    icon: <Trophy className="h-5 w-5" />,
    condition: ({ progress }) => (progress?.progress ?? 0) === 100,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
];

// ============ Achievement Badges Component ============
export function AchievementBadges({
  fields,
  overallProgress,
}: {
  fields: FieldWithDetails[];
  overallProgress: ProgressData | null;
}) {
  const [newlyEarned, setNewlyEarned] = useState<string | null>(null);
  const hasNotifiedRef = React.useRef(false);

  // Compute earned badges from current data
  const data = useMemo(() => ({ fields, progress: overallProgress }), [fields, overallProgress]);

  const currentEarned = useMemo(() =>
    BADGES.filter((badge) => badge.condition(data)).map((b) => b.id),
    [data]
  );

  // Merge with previously stored badges from localStorage
  const earnedBadges = useMemo(() => {
    let previousEarned: string[] = [];
    try {
      const stored = localStorage.getItem('qurtubah_achievements');
      previousEarned = stored ? JSON.parse(stored) : [];
    } catch {
      // ignore parse errors
    }
    const allEarned = Array.from(new Set([...previousEarned, ...currentEarned]));

    // Update localStorage
    try {
      localStorage.setItem('qurtubah_achievements', JSON.stringify(allEarned));
    } catch {
      // ignore storage errors
    }

    return allEarned;
  }, [currentEarned]);

  // Notify on newly earned badges (run once per session)
  useEffect(() => {
    if (hasNotifiedRef.current) return;
    const newBadges = currentEarned.filter((id) => {
      try {
        const stored = localStorage.getItem('qurtubah_achievements');
        const prev: string[] = stored ? JSON.parse(stored) : [];
        return !prev.includes(id);
      } catch {
        return false;
      }
    });
    if (newBadges.length > 0) {
      hasNotifiedRef.current = true;
      const timer = setTimeout(() => {
        setNewlyEarned(newBadges[0]);
        setTimeout(() => setNewlyEarned(null), 3000);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentEarned]);

  const earnedCount = earnedBadges.length;
  const totalBadges = BADGES.length;

  return (
    <Card className="border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            الإنجازات
            <span className="text-xs font-normal text-amber-500 dark:text-amber-400">
              ({earnedCount}/{totalBadges})
            </span>
          </CardTitle>
          {earnedCount > 0 && (
            <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {BADGES.map((badge) => {
            const isEarned = earnedBadges.includes(badge.id);
            const isNewlyEarned = newlyEarned === badge.id;

            return (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`achievement-badge ${isEarned ? 'earned' : 'locked'} ${isNewlyEarned ? 'animate-slide-in-bounce' : ''}`}
                    >
                      <div className={`${isEarned ? badge.color : 'text-slate-300 dark:text-slate-600'} transition-colors`}>
                        {isEarned ? badge.icon : <Lock className="h-5 w-5" />}
                      </div>
                      <span className={`text-[9px] font-medium text-center leading-tight ${
                        isEarned ? 'text-sky-700 dark:text-sky-300' : 'text-slate-400 dark:text-slate-600'
                      }`}>
                        {badge.name}
                      </span>
                      {isNewlyEarned && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse-ring" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[180px] text-xs" dir="rtl">
                    <p className="font-medium text-sky-900 dark:text-sky-100 mb-1">{badge.name}</p>
                    <p className="text-sky-500 dark:text-sky-400 text-[10px]">{badge.description}</p>
                    {!isEarned && (
                      <p className="text-amber-500 dark:text-amber-400 text-[10px] mt-1 flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        مؤمّد
                      </p>
                    )}
                    {isEarned && (
                      <p className="text-emerald-500 dark:text-emerald-400 text-[10px] mt-1 flex items-center gap-1">
                        <Unlock className="h-2.5 w-2.5" />
                        مُحقّق
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
