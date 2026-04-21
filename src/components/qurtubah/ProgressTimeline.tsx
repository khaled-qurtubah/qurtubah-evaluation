'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { domainBarColors } from './constants';

// ============ Types ============
interface SnapshotData {
  id: string;
  date: string;
  fieldId: string | null;
  progress: number;
  totalUploaded: number;
  totalRequired: number;
  completedIndicators: number;
}

interface TimelineDataPoint {
  date: string;
  dateLabel: string;
  overall: number;
  [key: string]: number | string;
}

interface FieldInfo {
  id: string;
  name: string;
}

// ============ Domain names in order ============
const DOMAIN_NAMES = [
  'الإدارة المدرسية',
  'التعليم والتعلم',
  'نواتج التعلم',
  'البيئة المدرسية',
];

const DOMAIN_COLORS = domainBarColors; // sky, teal, amber, emerald

// ============ Custom Tooltip ============
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm max-w-[250px]">
        <p className="font-bold text-sky-900 dark:text-sky-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sky-600 dark:text-sky-400">{entry.name}:</span>
            <span className="font-bold text-sky-900 dark:text-sky-100">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============ Trend Indicator ============
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return (
      <span className="flex items-center gap-1 text-slate-400 text-xs">
        <Minus className="h-3 w-3" /> ثابت
      </span>
    );
  }
  const diff = current - previous;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
        <TrendingUp className="h-3 w-3" /> +{diff.toFixed(1)}%
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
        <TrendingDown className="h-3 w-3" /> {diff.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-slate-400 text-xs">
      <Minus className="h-3 w-3" /> ثابت
    </span>
  );
}

// ============ Progress Velocity ============
function calculateVelocity(snapshots: SnapshotData[], fieldId: string | null): number {
  const filtered = snapshots.filter((s) => s.fieldId === fieldId);
  if (filtered.length < 2) return 0;

  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const firstDate = new Date(first.date);
  const lastDate = new Date(last.date);
  const weeksDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7);

  if (weeksDiff <= 0) return 0;
  return (last.progress - first.progress) / weeksDiff;
}

// ============ Main ProgressTimeline Component ============
export function ProgressTimeline({ fields }: { fields: FieldInfo[] }) {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch('/api/snapshots');
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger a new snapshot
    try {
      await fetch('/api/snapshots', { method: 'POST' });
    } catch {
      // ignore
    }
    await fetchSnapshots();
  };

  // Transform snapshots into timeline data
  const timelineData = React.useMemo(() => {
    // Get unique dates
    const dateMap = new Map<string, TimelineDataPoint>();

    // Sort snapshots by date
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const snap of sorted) {
      const dateKey = new Date(snap.date).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        const dateObj = new Date(snap.date);
        dateMap.set(dateKey, {
          date: dateKey,
          dateLabel: dateObj.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          overall: 0,
        });
      }
      const point = dateMap.get(dateKey)!;
      if (snap.fieldId === null) {
        point.overall = snap.progress;
      } else {
        const fieldIndex = fields.findIndex((f) => f.id === snap.fieldId);
        const fieldName = fieldIndex >= 0 ? `domain_${fieldIndex}` : snap.fieldId;
        point[fieldName] = snap.progress;
      }
    }

    return Array.from(dateMap.values());
  }, [snapshots, fields]);

  // Calculate trend and velocity
  const overallVelocity = calculateVelocity(snapshots, null);
  const overallSnapshots = snapshots
    .filter((s) => s.fieldId === null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestOverall = overallSnapshots.length > 0 ? overallSnapshots[overallSnapshots.length - 1].progress : 0;
  const prevOverall = overallSnapshots.length > 1 ? overallSnapshots[overallSnapshots.length - 2].progress : latestOverall;

  // Domain velocities
  const domainVelocities = fields.map((_, i) => calculateVelocity(snapshots, fields[i]?.id));

  if (loading) {
    return (
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Card className="border-sky-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
            <Clock className="h-5 w-5 text-sky-600" />
            تطور التقدم عبر الزمن
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto mb-3 text-sky-300 opacity-40" />
          <p className="text-sky-500 dark:text-sky-400 mb-3">لا توجد بيانات تاريخية بعد</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            إنشاء لقطة تقدم
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up card-inner-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2 heading-decorated">
            <Clock className="h-5 w-5 text-sky-600" />
            تطور التقدم عبر الزمن
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Area Chart */}
        <div className="w-full" dir="ltr">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
                {DOMAIN_COLORS.map((color, i) => (
                  <linearGradient key={`gradientDomain${i}`} id={`gradientDomain${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                formatter={(value: string) => {
                  if (value === 'overall') return 'الإجمالي';
                  const match = value.match(/^domain_(\d+)$/);
                  if (match) return DOMAIN_NAMES[parseInt(match[1])] || value;
                  return value;
                }}
              />
              {/* Overall progress - thicker line */}
              <Area
                type="monotone"
                dataKey="overall"
                name="overall"
                stroke="#0284c7"
                strokeWidth={3}
                fill="url(#gradientOverall)"
                dot={{ r: 3, fill: '#0284c7', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
              />
              {/* Domain lines */}
              {fields.map((field, i) => (
                <Area
                  key={field.id}
                  type="monotone"
                  dataKey={`domain_${i}`}
                  name={`domain_${i}`}
                  stroke={DOMAIN_COLORS[i % 4]}
                  strokeWidth={2}
                  fill={`url(#gradientDomain${i % 4})`}
                  dot={{ r: 2.5, fill: DOMAIN_COLORS[i % 4], stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 4, fill: DOMAIN_COLORS[i % 4], stroke: '#fff', strokeWidth: 1.5 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Indicators & Velocity */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Overall */}
          <div className="rounded-xl bg-sky-50 dark:bg-slate-800 p-3 border border-sky-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-sky-700 dark:text-sky-300">الإجمالي</span>
              <TrendIndicator current={latestOverall} previous={prevOverall} />
            </div>
            <p className="text-lg font-bold text-sky-900 dark:text-sky-100">{latestOverall.toFixed(1)}%</p>
            <p className="text-[10px] text-sky-500 dark:text-sky-400 mt-0.5">
              السرعة: {overallVelocity >= 0 ? '+' : ''}{overallVelocity.toFixed(1)}%/أسبوع
            </p>
          </div>

          {/* Domains */}
          {fields.map((field, i) => {
            const domainSnaps = snapshots
              .filter((s) => s.fieldId === field.id)
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const latest = domainSnaps.length > 0 ? domainSnaps[domainSnaps.length - 1].progress : 0;
            const prev = domainSnaps.length > 1 ? domainSnaps[domainSnaps.length - 2].progress : latest;
            const velocity = domainVelocities[i] || 0;

            return (
              <div
                key={field.id}
                className="rounded-xl p-3 border dark:border-slate-700"
                style={{
                  backgroundColor: `${DOMAIN_COLORS[i % 4]}10`,
                  borderColor: `${DOMAIN_COLORS[i % 4]}30`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate" style={{ color: DOMAIN_COLORS[i % 4] }}>
                    {DOMAIN_NAMES[i] || field.name}
                  </span>
                  <TrendIndicator current={latest} previous={prev} />
                </div>
                <p className="text-lg font-bold" style={{ color: DOMAIN_COLORS[i % 4] }}>
                  {latest.toFixed(1)}%
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: DOMAIN_COLORS[i % 4], opacity: 0.7 }}>
                  السرعة: {velocity >= 0 ? '+' : ''}{velocity.toFixed(1)}%/أسبوع
                </p>
              </div>
            );
          })}
        </div>

        {/* Data points count */}
        <div className="mt-4 text-center text-xs text-sky-400 dark:text-sky-500">
          {snapshots.filter((s) => s.fieldId === null).length} نقطة بيانة • آخر تحديث:{' '}
          {overallSnapshots.length > 0
            ? new Date(overallSnapshots[overallSnapshots.length - 1].date).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '—'}
        </div>
      </CardContent>
    </Card>
  );
}
