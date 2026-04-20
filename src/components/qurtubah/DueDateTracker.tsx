'use client';

import React, { useMemo } from 'react';
import {
  Clock, AlertTriangle, Calendar, ChevronLeft, CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { FieldWithDetails } from './types';
import { domainBarColors } from './constants';

interface DueDateItem {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  indicatorName: string;
  fieldName: string;
  fieldOrder: number;
  daysUntilDue: number;
  isOverdue: boolean;
  isDueSoon: boolean;
}

// ============ Due Date Tracker Widget ============
export function DueDateTracker({
  fields,
  onViewField,
}: {
  fields: FieldWithDetails[];
  onViewField?: (fieldId: string) => void;
}) {
  const dueDateItems = useMemo(() => {
    const items: DueDateItem[] = [];
    const now = new Date();

    fields.forEach((field, fIdx) => {
      field.standards.forEach((standard) => {
        standard.indicators.forEach((indicator) => {
          indicator.evidences.forEach((ev) => {
            if (!ev.dueDate) return;
            const dueDate = new Date(ev.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 14;

            if (isOverdue || isDueSoon) {
              items.push({
                id: ev.id,
                name: ev.name,
                dueDate: ev.dueDate,
                status: ev.status,
                indicatorName: indicator.name,
                fieldName: field.name,
                fieldOrder: fIdx,
                daysUntilDue,
                isOverdue,
                isDueSoon,
              });
            }
          });
        });
      });
    });

    // Sort: overdue first (most overdue first), then by due date ascending
    return items.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });
  }, [fields]);

  const overdueCount = dueDateItems.filter((i) => i.isOverdue).length;
  const dueSoonCount = dueDateItems.filter((i) => i.isDueSoon && !i.isOverdue).length;

  if (dueDateItems.length === 0) {
    return null; // Don't show if no due dates
  }

  return (
    <Card className="mb-6 border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Calendar className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            مواعيد الاستحقاق
            {overdueCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 gap-0.5 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" />
                {overdueCount} متأخر
              </Badge>
            )}
            {dueSoonCount > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {dueSoonCount} قريب
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
          {dueDateItems.map((item) => {
            const domainColor = domainBarColors[item.fieldOrder % 4];
            const dueDateFormatted = new Date(item.dueDate).toLocaleDateString('ar-SA', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all hover:shadow-sm ${
                  item.isOverdue
                    ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                    : 'border-amber-200 bg-amber-50/30 dark:border-amber-800/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: domainColor }} />
                      <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">
                        {item.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-sky-500 dark:text-sky-400">
                      <span className="truncate">{item.indicatorName}</span>
                      <span className="text-sky-300 dark:text-slate-600">•</span>
                      <span className="shrink-0 font-medium" style={{ color: domainColor }}>
                        {item.fieldName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'approved' && (
                      <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        معتمد
                      </Badge>
                    )}
                    {item.isOverdue ? (
                      <Badge variant="destructive" className="text-[9px] px-1.5 gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        متأخر {Math.abs(item.daysUntilDue)} يوم
                      </Badge>
                    ) : item.daysUntilDue === 0 ? (
                      <Badge className="bg-red-500 text-white text-[9px] px-1.5">
                        اليوم
                      </Badge>
                    ) : item.daysUntilDue <= 3 ? (
                      <Badge className="bg-red-500 text-white text-[9px] px-1.5">
                        باقي {item.daysUntilDue} أيام
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        باقي {item.daysUntilDue} يوم
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-sky-400 dark:text-sky-500 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {dueDateFormatted}
                  </span>
                  {onViewField && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-0.5 text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 p-0"
                      onClick={() => {
                        const field = fields.find((f, i) => i === item.fieldOrder);
                        if (field) onViewField(field.id);
                      }}
                    >
                      عرض <ArrowRight className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
