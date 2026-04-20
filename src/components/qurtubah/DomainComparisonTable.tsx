'use client';

import React from 'react';
import { Building2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { domainBarColors, domainBarBgColors, iconMap } from './constants';
import type { FieldWithDetails } from './types';

// ============ Domain Comparison Table Component ============
export function DomainComparisonTable({ fields }: { fields: FieldWithDetails[] }) {
  const sortedFields = [...fields].sort((a, b) => a.progress - b.progress);

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-sky-600" />
          مقارنة المجالات
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto sticky-table-header">
          <Table className="table-header-enhanced">
            <TableHeader>
              <TableRow className="bg-sky-50/80 dark:bg-slate-800/80 hover:bg-sky-50/80 dark:hover:bg-slate-800/80">
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs">المجال</TableHead>
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs text-center">المعايير</TableHead>
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs text-center">المؤشرات</TableHead>
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs text-center">مكتملة</TableHead>
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs text-center">الشواهد</TableHead>
                <TableHead className="text-sky-800 dark:text-sky-200 font-semibold text-xs text-center min-w-[140px]">النسبة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFields.map((field, index) => {
                const originalIndex = fields.indexOf(field);
                const barColor = domainBarColors[originalIndex % 4];
                const barBg = domainBarBgColors[originalIndex % 4];
                const IconComponent = iconMap[field.icon || 'Building2'] || Building2;
                return (
                  <TableRow key={field.id} className="enhanced-table-row table-row-accent">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: barColor }} />
                        <IconComponent className="h-4 w-4 shrink-0" style={{ color: barColor }} />
                        <span className="text-sky-900 dark:text-sky-100 text-sm truncate max-w-[150px]">{field.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-sky-700 dark:text-sky-300">{field.standardsCount}</TableCell>
                    <TableCell className="text-center text-sm text-sky-700 dark:text-sky-300">{field.indicatorsCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={field.completedIndicators === field.indicatorsCount ? 'default' : 'secondary'} className={`text-xs ${field.completedIndicators === field.indicatorsCount ? 'bg-emerald-600' : ''}`}>
                        {field.completedIndicators}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-sky-700 dark:text-sky-300">
                      {field.totalUploaded}/{field.totalRequired}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${field.progress}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <span className="text-sm font-bold min-w-[36px]" style={{ color: barColor }}>
                          {field.progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
