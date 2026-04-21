'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitCompare, Camera, Trash2, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Snapshot Types ============
interface ProgressSnapshot {
  id: string;
  timestamp: string;
  label: string;
  overallProgress: number;
  totalUploaded: number;
  totalRequired: number;
  completedIndicators: number;
  totalIndicators: number;
  domains: {
    id: string;
    name: string;
    progress: number;
    totalUploaded: number;
    totalRequired: number;
    completedIndicators: number;
    totalIndicators: number;
  }[];
}

const STORAGE_KEY = 'qurtubah_snapshots';

function loadSnapshots(): ProgressSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: ProgressSnapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.slice(0, 20)));
  } catch {
    // ignore
  }
}

// ============ Comparison Widget Component ============
export function ComparisonWidget({ fields }: { fields: FieldWithDetails[] }) {
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>(loadSnapshots);
  const [selectedBefore, setSelectedBefore] = useState<string>('');
  const [selectedAfter, setSelectedAfter] = useState<string>('');
  const [expanded, setExpanded] = useState(true);

  const totalIndicators = fields.reduce((sum, f) => sum + f.indicatorsCount, 0);
  const completedIndicators = fields.reduce((sum, f) => sum + f.completedIndicators, 0);
  const totalRequired = fields.reduce((sum, f) => sum + f.totalRequired, 0);
  const totalUploaded = fields.reduce((sum, f) => sum + f.totalUploaded, 0);
  const overallProgress = totalRequired > 0 ? Math.min(100, Math.round((totalUploaded / totalRequired) * 100)) : 0;

  // Take a snapshot
  const takeSnapshot = useCallback(() => {
    const newSnapshot: ProgressSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      overallProgress,
      totalUploaded,
      totalRequired,
      completedIndicators,
      totalIndicators,
      domains: fields.map((f, idx) => ({
        id: f.id,
        name: f.name,
        progress: f.progress,
        totalUploaded: f.totalUploaded,
        totalRequired: f.totalRequired,
        completedIndicators: f.completedIndicators,
        totalIndicators: f.indicatorsCount,
      })),
    };
    const updated = [newSnapshot, ...snapshots].slice(0, 20);
    saveSnapshots(updated);
    setSnapshots(updated);
  }, [fields, snapshots, overallProgress, totalUploaded, totalRequired, completedIndicators, totalIndicators]);

  // Delete snapshot
  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    saveSnapshots(updated);
    setSnapshots(updated);
    if (selectedBefore === id) setSelectedBefore('');
    if (selectedAfter === id) setSelectedAfter('');
  };

  // Get comparison data
  const beforeSnapshot = snapshots.find((s) => s.id === selectedBefore);
  const afterSnapshot = snapshots.find((s) => s.id === selectedAfter);

  const overallDelta = beforeSnapshot && afterSnapshot
    ? afterSnapshot.overallProgress - beforeSnapshot.overallProgress
    : null;

  return (
    <Card className="border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
            <GitCompare className="h-5 w-5 text-sky-500" />
            مقارنة التقدم
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-sky-200 dark:border-sky-800"
              onClick={takeSnapshot}
            >
              <Camera className="h-3.5 w-3.5" />
              حفظ لقطة
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {snapshots.length < 2 ? (
            <div className="text-center py-6">
              <GitCompare className="h-10 w-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-sky-600 dark:text-sky-400">
                يجب حفظ لقطتين على الأقل للمقارنة
              </p>
              <p className="text-xs text-sky-400 dark:text-sky-500 mt-1">
                اللقطات المحفوظة: {snapshots.length}/2 المطلوبة
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Snapshot selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-sky-700 dark:text-sky-300 mb-1 block">اللقبلة السابقة</label>
                  <Select value={selectedBefore} onValueChange={setSelectedBefore}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="اختر لقطة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshots.map((s) => (
                        <SelectItem key={s.id} value={s.id} disabled={s.id === selectedAfter}>
                          {s.label} ({s.overallProgress}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-sky-700 dark:text-sky-300 mb-1 block">اللقبلة اللاحقة</label>
                  <Select value={selectedAfter} onValueChange={setSelectedAfter}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="اختر لقطة..." />
                    </SelectTrigger>
                    <SelectContent>
                      {snapshots.map((s) => (
                        <SelectItem key={s.id} value={s.id} disabled={s.id === selectedBefore}>
                          {s.label} ({s.overallProgress}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Comparison Results */}
              {beforeSnapshot && afterSnapshot && (
                <div className="space-y-4 animate-fade-in">
                  {/* Overall delta */}
                  {overallDelta !== null && (
                    <div className={`p-3 rounded-xl text-center ${
                      overallDelta > 0
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                        : overallDelta < 0
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        {overallDelta > 0 ? (
                          <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                        ) : overallDelta < 0 ? (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        ) : null}
                        <span className={`text-2xl font-bold ${
                          overallDelta > 0 ? 'text-emerald-600 dark:text-emerald-400'
                            : overallDelta < 0 ? 'text-red-600 dark:text-red-400'
                              : 'text-sky-600 dark:text-sky-400'
                        }`}>
                          {overallDelta > 0 ? '+' : ''}{overallDelta}%
                        </span>
                      </div>
                      <p className="text-xs text-sky-500 dark:text-sky-400 mt-1">
                        التغير في نسبة الإنجاز الكلي
                      </p>
                    </div>
                  )}

                  {/* Domain-by-domain comparison */}
                  <div className="space-y-3">
                    {beforeSnapshot.domains.map((beforeDomain, idx) => {
                      const afterDomain = afterSnapshot.domains.find((d) => d.id === beforeDomain.id);
                      if (!afterDomain) return null;
                      const domainDelta = afterDomain.progress - beforeDomain.progress;
                      const domainColor = domainBarColors[idx % 4];

                      return (
                        <div key={beforeDomain.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domainColor }} />
                              <span className="text-xs font-medium text-sky-800 dark:text-sky-200">
                                {beforeDomain.name}
                              </span>
                            </div>
                            <span className={`text-xs font-bold ${
                              domainDelta > 0 ? 'text-emerald-600 dark:text-emerald-400'
                                : domainDelta < 0 ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-500'
                            }`}>
                              {domainDelta > 0 ? '+' : ''}{domainDelta}%
                            </span>
                          </div>
                          {/* Side-by-side bars */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-sky-500 dark:text-sky-400 w-8">قبل</span>
                              <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 opacity-60"
                                  style={{ width: `${beforeDomain.progress}%`, backgroundColor: domainColor }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 w-8 text-left">
                                {beforeDomain.progress}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-sky-500 dark:text-sky-400 w-8">بعد</span>
                              <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${afterDomain.progress}%`, backgroundColor: domainColor }}
                                />
                              </div>
                              <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 w-8 text-left">
                                {afterDomain.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved Snapshots List */}
              <div className="mt-4 pt-3 border-t border-sky-100 dark:border-slate-700">
                <p className="text-xs font-medium text-sky-700 dark:text-sky-300 mb-2">
                  اللقطات المحفوظة ({snapshots.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {snapshots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <p className="text-[11px] font-medium text-sky-800 dark:text-sky-200">{s.label}</p>
                        <p className="text-[10px] text-sky-500 dark:text-sky-400">
                          الإنجاز: {s.overallProgress}% • {s.completedIndicators}/{s.totalIndicators} مؤشر
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => deleteSnapshot(s.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
