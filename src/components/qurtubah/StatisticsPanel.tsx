'use client';

import React from 'react';
import {
  BarChart3, ArrowUpRight, ArrowDownRight, Target, TrendingUp, ClipboardList,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { domainBarColors, domainBarBgColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Statistics Panel ============
export function StatisticsPanel({ fields }: { fields: FieldWithDetails[] }) {
  // Calculate statistics
  const allEvidence = fields.flatMap((f) =>
    f.standards.flatMap((s) =>
      s.indicators.flatMap((ind) =>
        ind.evidences.map((ev) => ({ ...ev, fieldName: f.name, standardName: s.name, indicatorName: ind.name, fieldProgress: f.progress }))
      )
    )
  );

  const draftCount = allEvidence.filter((e) => e.status === 'draft').length;
  const submittedCount = allEvidence.filter((e) => e.status === 'submitted').length;
  const approvedCount = allEvidence.filter((e) => e.status === 'approved').length;
  const totalCount = allEvidence.length;

  // Get all standards with progress
  const allStandards = fields.flatMap((f) =>
    f.standards.map((s) => {
      const indicators = s.indicators;
      const required = indicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const uploaded = indicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
      const completed = indicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length;
      const progress = required > 0 ? Math.round((uploaded / required) * 100) : 0;
      return { id: s.id, name: s.name, fieldName: f.name, indicators: indicators.length, completed, uploaded, required, progress };
    })
  );

  // Sort by progress for strengths/improvements
  const strengths = [...allStandards].sort((a, b) => b.progress - a.progress).slice(0, 3);
  const improvements = [...allStandards].sort((a, b) => a.progress - b.progress).slice(0, 3);

  const statusData = [
    { name: 'مسودة', value: draftCount, color: '#94a3b8' },
    { name: 'مقدّم', value: submittedCount, color: '#f59e0b' },
    { name: 'معتمد', value: approvedCount, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">الإحصائيات والتحليلات</h3>

      {/* Evidence Status Donut */}
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-sky-600" />
            توزيع حالات الشواهد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* CSS Donut */}
            <div className="relative shrink-0">
              <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={70} cy={70} r={52} fill="none" stroke="#e2e8f0" strokeWidth={24} className="dark:stroke-slate-700" />
                {(() => {
                  const circumference = 52 * 2 * Math.PI;
                  let offset = 0;
                  return statusData.map((seg, i) => {
                    const pct = totalCount > 0 ? seg.value / totalCount : 0;
                    const dashLength = pct * circumference;
                    const dashGap = circumference - dashLength;
                    const el = (
                      <circle key={i} cx={70} cy={70} r={52} fill="none" stroke={seg.color} strokeWidth={24}
                        strokeDasharray={`${dashLength} ${dashGap}`} strokeDashoffset={-offset}
                        style={{ transition: 'all 0.8s ease-out' }} />
                    );
                    offset += dashLength;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-sky-900 dark:text-sky-100">{totalCount}</span>
                <span className="text-[10px] text-sky-500">شاهد</span>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3 flex-1">
              {statusData.map((seg) => (
                <div key={seg.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-sm text-sky-700 dark:text-sky-300 flex-1">{seg.name}</span>
                  <span className="font-bold text-sky-900 dark:text-sky-100">{seg.value}</span>
                  <span className="text-xs text-sky-400">({totalCount > 0 ? Math.round((seg.value / totalCount) * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Completion Comparison */}
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            مقارنة إكمال المجالات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, i) => (
            <div key={field.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-800 dark:text-sky-200 font-medium">{field.name}</span>
                <span className="font-bold" style={{ color: domainBarColors[i % 4] }}>{field.progress}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: domainBarBgColors[i % 4] }}>
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${field.progress}%`, backgroundColor: domainBarColors[i % 4] }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-sky-400">
                <span>{field.completedIndicators} / {field.indicatorsCount} مؤشرات مكتملة</span>
                <span>{field.totalUploaded} / {field.totalRequired} شاهد</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              نقاط القوة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strengths.map((std, i) => (
              <div key={std.id} className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">{std.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{std.fieldName} • {std.completed}/{std.indicators} مؤشرات</p>
                </div>
                <Badge className="bg-emerald-600 text-white">{std.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-amber-600" />
              نقاط التحسين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {improvements.map((std, i) => (
              <div key={std.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-bold">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 truncate">{std.name}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">{std.fieldName} • {std.completed}/{std.indicators} مؤشرات</p>
                </div>
                <Badge className="bg-amber-500 text-white">{std.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart - Domain Performance */}
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-sky-600" />
            أداء المجالات - رادار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={fields.map((f) => ({
                domain: f.name.replace('المدرسية', '').replace('والتعلم', '').trim().substring(0, 15),
                progress: f.progress,
                fullMark: 100,
              }))}>
                <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-600" />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: '#0c4a6e' }} className="dark:fill-sky-300" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="الإنجاز" dataKey="progress" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Completion Trend - Required vs Uploaded */}
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-sky-600" />
            تحليل الفجوة - المطلوب مقابل المرفوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsBarChart data={fields.map((f) => ({
              name: f.name.replace('المدرسية', '').replace('والتعلم', '').trim().substring(0, 15),
              required: f.totalRequired,
              uploaded: f.totalUploaded,
            }))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RechartsTooltip
                contentStyle={{ direction: 'rtl', textAlign: 'right', fontFamily: 'Tajawal' }}
                formatter={(value: number, name: string) => [value, name === 'required' ? 'المطلوب' : 'المرفوع']}
              />
              <Bar dataKey="required" fill="#94a3b8" name="required" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uploaded" fill="#0ea5e9" name="uploaded" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
