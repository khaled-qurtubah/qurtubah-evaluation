'use client';

import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3 } from 'lucide-react';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Heatmap Grid Component ============
export function HeatmapGrid({ fields }: { fields: FieldWithDetails[] }) {
  const heatmapData = useMemo(() => {
    const data: {
      id: string;
      name: string;
      standardName: string;
      fieldName: string;
      fieldOrder: number;
      progress: number;
      uploaded: number;
      required: number;
    }[] = [];

    fields.forEach((field, fIdx) => {
      field.standards.forEach((standard) => {
        standard.indicators.forEach((indicator) => {
          const uploaded = indicator.evidences.length;
          const required = indicator.requiredEvidence;
          const progress = required > 0 ? Math.min(100, Math.round((uploaded / required) * 100)) : 0;
          data.push({
            id: indicator.id,
            name: indicator.name,
            standardName: standard.name,
            fieldName: field.name,
            fieldOrder: fIdx,
            progress,
            uploaded,
            required,
          });
        });
      });
    });

    return data;
  }, [fields]);

  const getColor = (progress: number, fieldOrder: number) => {
    const domainColor = domainBarColors[fieldOrder % 4];
    if (progress === 0) return 'bg-slate-200 dark:bg-slate-700';
    if (progress === 100) return 'bg-emerald-400 dark:bg-emerald-500';
    // Mix domain color with amber for in-progress
    if (progress >= 75) return 'bg-amber-300 dark:bg-amber-600';
    if (progress >= 50) return 'bg-amber-400 dark:bg-amber-700';
    if (progress >= 25) return 'bg-amber-200 dark:bg-amber-800';
    return 'bg-amber-100 dark:bg-amber-900/50';
  };

  const getBorderColor = (fieldOrder: number) => {
    return domainBarColors[fieldOrder % 4];
  };

  // Group by field
  const groupedByField = useMemo(() => {
    const groups: Record<string, typeof heatmapData> = {};
    heatmapData.forEach((item) => {
      if (!groups[item.fieldName]) groups[item.fieldName] = [];
      groups[item.fieldName].push(item);
    });
    return groups;
  }, [heatmapData]);

  const totalComplete = heatmapData.filter((d) => d.progress === 100).length;
  const totalItems = heatmapData.length;

  return (
    <Card className="border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30">
              <Grid3X3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            خريطة الإنجاز الحرارية
            <span className="text-xs font-normal text-sky-500 dark:text-sky-400">
              ({totalComplete}/{totalItems} مكتمل)
            </span>
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] text-sky-500 dark:text-sky-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
              <span>فارغ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800" />
              <span>قيد التنفيذ</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-500" />
              <span>مكتمل</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {Object.entries(groupedByField).map(([fieldName, items], fIdx) => (
            <div key={fieldName}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getBorderColor(fIdx) }}
                />
                <span className="text-xs font-medium text-sky-700 dark:text-sky-300">{fieldName}</span>
                <span className="text-[10px] text-sky-400 dark:text-sky-500">
                  ({items.filter((i) => i.progress === 100).length}/{items.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                <TooltipProvider delayDuration={200}>
                  {items.map((item) => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`heatmap-cell w-5 h-5 ${getColor(item.progress, fIdx)}`}
                          style={{
                            borderLeft: `2px solid ${getBorderColor(fIdx)}20`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs" dir="rtl">
                        <p className="font-medium text-sky-900 dark:text-sky-100 mb-1 line-clamp-2">{item.name}</p>
                        <p className="text-sky-500 dark:text-sky-400 text-[10px] mb-1">{item.standardName}</p>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${item.progress === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {item.progress}%
                          </span>
                          <span className="text-sky-400">({item.uploaded}/{item.required})</span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
