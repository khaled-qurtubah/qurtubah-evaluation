'use client';

import React from 'react';
import {
  RadarChart as RechartsRadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Custom Tooltip for Radar Chart ============
const CustomRadarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm" dir="rtl">
        <p className="font-bold text-sky-900 dark:text-sky-100">{payload[0].payload.name}</p>
        <p className="text-sky-600 dark:text-sky-400">نسبة الإنجاز: <span className="font-bold">{payload[0].value}%</span></p>
        <p className="text-sky-500 dark:text-sky-400 text-xs">الشواهد: {payload[0].payload.uploaded}/{payload[0].payload.required}</p>
      </div>
    );
  }
  return null;
};

// ============ Domain Radar Chart Component ============
export function DomainRadarChart({ fields }: { fields: FieldWithDetails[] }) {
  const chartData = fields.map((field, index) => ({
    name: field.name,
    progress: field.progress,
    uploaded: field.totalUploaded,
    required: field.totalRequired,
    color: domainBarColors[index % 4],
  }));

  const maxProgress = Math.max(...fields.map((f) => f.progress), 100);

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <Compass className="h-5 w-5 text-sky-600" />
          مقارنة المجالات - الرسم الراداري
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full max-w-md mx-auto">
          <ResponsiveContainer width="100%" height={300}>
            <RechartsRadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid
                stroke="#e2e8f0"
                className="dark:opacity-20"
              />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                className="text-sky-600"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, Math.max(maxProgress, 100)]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickCount={5}
              />
              <RechartsTooltip content={<CustomRadarTooltip />} />
              <Radar
                name="نسبة الإنجاز"
                dataKey="progress"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.2}
                strokeWidth={2}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domainBarColors[i % 4] }} />
              <span className="text-sky-700 dark:text-sky-300">{field.name}</span>
              <span className="font-bold" style={{ color: domainBarColors[i % 4] }}>{field.progress}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
