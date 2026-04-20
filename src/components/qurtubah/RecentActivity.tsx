'use client';

import React, { useState } from 'react';
import { Clock, ChevronLeft, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Recent Activity Component ============
export function RecentActivity({ fields, onFieldClick }: { fields: FieldWithDetails[]; onFieldClick: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false);

  // Relative time helper
  const getRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'منذ يوم';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffWeeks === 1) return 'منذ أسبوع';
    if (diffWeeks < 4) return `منذ ${diffWeeks} أسابيع`;
    if (diffMonths === 1) return 'منذ شهر';
    return `منذ ${diffMonths} أشهر`;
  };

  // Collect all evidence with context
  const allEvidence: { evName: string; evDate: string; indName: string; standardName: string; fieldId: string; fieldName: string }[] = [];
  fields.forEach((field) => {
    field.standards.forEach((std) => {
      std.indicators.forEach((ind) => {
        ind.evidences.forEach((ev) => {
          allEvidence.push({
            evName: ev.name,
            evDate: ev.createdAt,
            indName: ind.name,
            standardName: std.name,
            fieldId: field.id,
            fieldName: field.name,
          });
        });
      });
    });
  });

  // Sort by date descending
  const sortedEvidence = allEvidence
    .sort((a, b) => new Date(b.evDate).getTime() - new Date(a.evDate).getTime());

  const recentItems = showAll ? sortedEvidence : sortedEvidence.slice(0, 5);

  if (sortedEvidence.length === 0) return null;

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
            <Clock className="h-5 w-5 text-amber-500" />
            آخر النشاطات
          </CardTitle>
          {sortedEvidence.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sky-600 dark:text-sky-400 gap-1"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'عرض أقل' : 'عرض الكل'}
              <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {/* Timeline connector */}
        <div className="absolute right-[23px] top-3 bottom-3 w-0.5 bg-sky-200/60 dark:bg-slate-700/60" />
        <div className="space-y-3">
          {recentItems.map((item, i) => {
            // Find the domain index for coloring
            const fieldIdx = fields.findIndex((f) => f.name === item.fieldName);
            const dotColor = domainBarColors[fieldIdx >= 0 ? fieldIdx % 4 : 0];
            return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-sky-50/50 dark:bg-slate-800/50 hover:bg-sky-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative timeline-item-hover"
              onClick={() => onFieldClick(item.fieldId)}
            >
              {/* Timeline dot - colored by domain */}
              {i < (showAll ? sortedEvidence.length - 1 : 4) && (
                <div className="timeline-connector" style={{ right: '11px' }} />
              )}
              <div className="relative z-10 p-1.5 rounded-lg shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: `${dotColor}20` }}>
                <FileText className="h-4 w-4" style={{ color: dotColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">{item.evName}</p>
                <p className="text-xs text-sky-500 dark:text-sky-400 truncate">{item.indName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5" style={{ borderColor: dotColor, color: dotColor }}>{item.fieldName}</Badge>
                  <span className="text-[10px] text-sky-400 dark:text-sky-500" title={new Date(item.evDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}>
                    {getRelativeTime(item.evDate)}
                  </span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
