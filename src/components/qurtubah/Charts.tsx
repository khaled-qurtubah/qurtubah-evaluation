'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell as RechartsCell,
  PieChart as RechartsPieChart, Pie,
} from 'recharts';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { domainBarColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Pie Chart Icon (inline SVG) ============
export function PieChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

// ============ Recharts Bar Chart Component ============
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-bold text-sky-900 dark:text-sky-100">{payload[0].payload.name}</p>
        <p className="text-sky-600 dark:text-sky-400">النسبة: <span className="font-bold">{payload[0].value}%</span></p>
      </div>
    );
  }
  return null;
};

export function HorizontalBarChart({ fields }: { fields: FieldWithDetails[] }) {
  const chartData = fields.map((field, index) => ({
    name: field.name,
    progress: field.progress,
    color: domainBarColors[index % 4],
  }));

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
          <BarChart3 className="h-5 w-5 text-sky-600" />
          تقدم المجالات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(14, 165, 233, 0.06)' }} />
            <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={28} animationDuration={1000} animationEasing="ease-out">
              {chartData.map((entry, index) => (
                <RechartsCell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ============ Recharts Donut Chart Component ============
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-bold text-sky-900 dark:text-sky-100">{payload[0].name}</p>
        <p className="text-sky-600 dark:text-sky-400">الشواهد: <span className="font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DonutChart({ fields, totalEvidence }: { fields: FieldWithDetails[]; totalEvidence: number }) {
  const chartData = fields.map((field, index) => ({
    name: field.name,
    value: field.totalUploaded,
    color: domainBarColors[index % 4],
  }));

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
          <PieChartIcon className="h-5 w-5 text-sky-600" />
          توزيع الشواهد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <ResponsiveContainer width={200} height={200}>
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <RechartsCell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-sky-900 dark:text-sky-100">{totalEvidence}</span>
              <span className="text-xs text-sky-500 dark:text-sky-400">شاهد</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: domainBarColors[i % 4] }} />
                <span className="text-sky-700 dark:text-sky-300 truncate flex-1">{field.name}</span>
                <span className="font-bold text-sky-900 dark:text-sky-100">{field.totalUploaded}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Completion Status Grid Component ============
export function CompletionStatusGrid({ fields }: { fields: FieldWithDetails[] }) {
  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          حالة إكمال المؤشرات
        </CardTitle>
        <div className="flex items-center gap-4 text-xs mt-2">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> مكتمل</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> قيد التنفيذ</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" /> لم يبدأ</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, fIdx) => {
          const allIndicators = field.standards.flatMap((s) => s.indicators);
          const fColor = domainBarColors[fIdx % 4];
          return (
            <div key={field.id}>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-200 mb-2">{field.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {allIndicators.map((ind) => {
                  const isComplete = ind.evidences.length >= ind.requiredEvidence;
                  const isInProgress = ind.evidences.length > 0 && !isComplete;
                  const dotColor = isComplete ? 'bg-emerald-400' : isInProgress ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600';
                  return (
                    <div
                      key={ind.id}
                      className={`w-4 h-4 rounded-full ${dotColor} transition-colors cursor-default`}
                      title={`${ind.name} (${ind.evidences.length}/${ind.requiredEvidence})`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
