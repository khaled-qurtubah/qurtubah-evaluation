'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Upload, ChevronUp, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ProgressData } from './types';

// ============ Quick Stats Widget (Floating) ============
export function QuickStatsWidget({ overallProgress }: { overallProgress: ProgressData | null }) {
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show widget after scrolling past the hero section (~300px)
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible || !overallProgress) return null;

  const remaining = overallProgress.totalRequired - overallProgress.totalUploaded;

  return (
    <div className={`fixed bottom-4 left-4 z-40 transition-all duration-500 ${collapsed ? 'w-auto' : 'w-72'}`}>
      {collapsed ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shadow-lg bg-white dark:bg-slate-800 border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-700 btn-press"
          onClick={() => setCollapsed(false)}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs font-bold">{overallProgress.progress}%</span>
          <ChevronUp className="h-3 w-3" />
        </Button>
      ) : (
        <Card className="border-sky-200 dark:border-slate-700 shadow-xl overflow-hidden animate-fade-in bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-l from-sky-50 to-sky-100/50 dark:from-slate-800 dark:to-slate-800/50 border-b border-sky-100 dark:border-slate-700">
            <span className="text-xs font-bold text-sky-900 dark:text-sky-100 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-sky-600" />
              إحصائيات سريعة
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setCollapsed(true)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-3">
            {/* Overall Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-700 dark:text-sky-300 font-medium">نسبة الإنجاز</span>
                <span className="font-bold text-sky-900 dark:text-sky-100">{overallProgress.progress}%</span>
              </div>
              <Progress value={overallProgress.progress} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{overallProgress.completedIndicators}</p>
                <p className="text-[9px] text-emerald-600 dark:text-emerald-500">مؤشر مكتمل</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Upload className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{overallProgress.totalUploaded}</p>
                <p className="text-[9px] text-amber-600 dark:text-amber-500">شاهد مرفوع</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                <BarChart3 className="h-4 w-4 text-sky-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{remaining}</p>
                <p className="text-[9px] text-sky-600 dark:text-sky-500">شاهد متبقي</p>
              </div>
            </div>

            {/* Scroll to top */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-sky-600 dark:text-sky-400 gap-1 h-7"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ChevronUp className="h-3.5 w-3.5" />
              العودة للأعلى
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
