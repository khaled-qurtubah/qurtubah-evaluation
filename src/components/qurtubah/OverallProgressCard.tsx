'use client';

import React, { useState, useMemo } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnimatedCounter } from './hooks';
import { CircularProgress } from './CircularProgress';
import type { ProgressData, FieldWithDetails } from './types';

// ============ Overall Progress Card Component ============
export function OverallProgressCard({ overallProgress, onRefresh, fields }: { overallProgress: ProgressData; onRefresh?: () => Promise<void>; fields?: FieldWithDetails[] }) {
  const animatedFields = useAnimatedCounter(overallProgress.totalFields);
  const animatedIndicators = useAnimatedCounter(overallProgress.totalIndicators);
  const animatedCompleted = useAnimatedCounter(overallProgress.completedIndicators);
  const animatedUploaded = useAnimatedCounter(overallProgress.totalUploaded);
  const animatedProgress = useAnimatedCounter(overallProgress.progress);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate last updated from most recent evidence updatedAt
  const lastUpdated = useMemo(() => {
    if (!fields || fields.length === 0) return null;
    const allEvidence = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences)));
    if (allEvidence.length === 0) return null;
    const latest = allEvidence.reduce((latest, ev) => {
      const d = new Date(ev.updatedAt || ev.createdAt);
      return d > latest ? d : latest;
    }, new Date(0));
    return latest;
  }, [fields]);

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة${diffMinutes > 1 ? '' : ''}`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة${diffHours > 1 ? '' : ''}`;
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const statBoxes = [
    { value: animatedFields, label: 'المجالات', detail: `${overallProgress.totalFields} مجالات تقييم`, gradient: 'gradient-text', bg: 'bg-sky-50/80 dark:bg-slate-800/50' },
    { value: animatedIndicators, label: 'المؤشرات', detail: `${overallProgress.totalIndicators} مؤشر أداء`, gradient: 'gradient-text', bg: 'bg-sky-50/80 dark:bg-slate-800/50' },
    { value: animatedCompleted, label: 'مكتملة', detail: `${overallProgress.completedIndicators} مؤشر مكتمل`, gradient: 'gradient-text-emerald', bg: 'bg-emerald-50/80 dark:bg-slate-800/50' },
    { value: animatedUploaded, label: 'الشواهد المرفوعة', detail: `${overallProgress.totalUploaded} شاهد مرفوع`, gradient: 'gradient-text', bg: 'bg-sky-50/80 dark:bg-slate-800/50' },
  ];

  return (
    <Card className="mb-8 border-sky-200 dark:border-slate-700 animate-slide-up glassmorphism-deep glow-sky-subtle gradient-border animated-gradient-bg">
      {/* Dot decorations in background */}
      <div className="dot-decoration" style={{ top: '15%', left: '8%' }} />
      <div className="dot-decoration" style={{ top: '40%', right: '12%' }} />
      <div className="dot-decoration" style={{ bottom: '20%', left: '20%' }} />
      <div className="dot-decoration" style={{ top: '60%', right: '5%' }} />
      <div className="dot-decoration" style={{ bottom: '10%', right: '25%' }} />

      <div className="absolute top-0 left-0 w-full h-1 bg-sky-100 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-l from-sky-500 to-sky-700 transition-all duration-700 progress-shimmer"
          style={{ width: `${overallProgress.progress}%` }}
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-sky-900 dark:text-sky-100">التقدم العام</CardTitle>
            {lastUpdated && (
              <span className="text-[11px] text-sky-400 dark:text-sky-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                آخر تحديث: {formatRelativeTime(lastUpdated)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button variant="ghost" size="icon" className="h-8 w-8 btn-press" onClick={handleRefresh} title="تحديث البيانات">
                <RefreshCw className={`h-4 w-4 text-sky-600 dark:text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {/* Circular Progress */}
            <div className="relative">
              <CircularProgress value={animatedProgress} size={64} strokeWidth={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">{animatedProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Progress value={overallProgress.progress} className="h-3 mb-4 progress-animated" />
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div className="progress-shimmer h-full" />
          </div>
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {statBoxes.map((stat, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className={`p-2 rounded-xl ${stat.bg} stat-box-hover cursor-default`}>
                    <p className={`text-3xl font-bold ${stat.gradient}`}>{stat.value}</p>
                    <p className="text-xs text-sky-500 dark:text-sky-400">{stat.label}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {stat.detail}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
