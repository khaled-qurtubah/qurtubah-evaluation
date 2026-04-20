'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, Plus, Clock, AlertCircle,
  CircleDot, FileWarning,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

interface IncompleteIndicator {
  id: string;
  name: string;
  standardName: string;
  fieldId: string;
  fieldName: string;
  fieldOrder: number;
  required: number;
  uploaded: number;
  missing: number;
  isOverdue: boolean;
}

// ============ Attention Widget Component ============
export function AttentionWidget({
  fields,
  onQuickAdd,
}: {
  fields: FieldWithDetails[];
  onQuickAdd?: (indicatorId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const incompleteIndicators = useMemo(() => {
    const items: IncompleteIndicator[] = [];
    fields.forEach((field, fIdx) => {
      field.standards.forEach((standard) => {
        standard.indicators.forEach((indicator) => {
          const uploaded = indicator.evidences.length;
          const required = indicator.requiredEvidence;
          if (uploaded < required) {
            // Check if any evidence has an overdue due date
            const isOverdue = indicator.evidences.some((ev) => {
              if (!ev.dueDate) return false;
              return new Date(ev.dueDate) < new Date();
            });

            items.push({
              id: indicator.id,
              name: indicator.name,
              standardName: standard.name,
              fieldId: field.id,
              fieldName: field.name,
              fieldOrder: fIdx,
              required,
              uploaded,
              missing: required - uploaded,
              isOverdue,
            });
          }
        });
      });
    });

    // Sort: overdue first, then by missing count descending
    return items.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return b.missing - a.missing;
    });
  }, [fields]);

  const totalIncomplete = incompleteIndicators.length;
  const overdueCount = incompleteIndicators.filter((i) => i.isOverdue).length;

  if (totalIncomplete === 0) {
    return (
      <Card className="mb-6 border-emerald-200 dark:border-emerald-800 overflow-hidden animate-fade-in">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">جميع المؤشرات مكتملة! 🎉</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-amber-300 dark:border-amber-800 overflow-hidden animate-fade-in">
      <CardHeader
        className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition-colors pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            مؤشرات تحتاج انتباه
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 gap-1">
              <FileWarning className="h-2.5 w-2.5" />
              {totalIncomplete}
            </Badge>
            {overdueCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 gap-1 animate-pulse">
                <Clock className="h-2.5 w-2.5" />
                {overdueCount} متأخر
              </Badge>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-amber-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-amber-500" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 animate-fade-in">
          <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
            {incompleteIndicators.map((item) => {
              const progress = item.required > 0 ? Math.round((item.uploaded / item.required) * 100) : 0;
              const domainColor = domainBarColors[item.fieldOrder % 4];

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all hover:shadow-sm ${
                    item.isOverdue
                      ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                      : 'border-amber-200 bg-amber-50/30 dark:border-amber-800/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CircleDot className="h-3.5 w-3.5 shrink-0" style={{ color: domainColor }} />
                        <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-sky-500 dark:text-sky-400">
                        <span className="truncate">{item.standardName}</span>
                        <span className="text-sky-300 dark:text-slate-600">•</span>
                        <span className="shrink-0 font-medium" style={{ color: domainColor }}>{item.fieldName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.isOverdue && (
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          متأخر
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                        ينقص {item.missing} شاهد
                      </Badge>
                      {onQuickAdd && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                          onClick={() => onQuickAdd(item.id)}
                          title="إضافة شاهد سريع"
                        >
                          <Plus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0">
                      {item.uploaded}/{item.required}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
