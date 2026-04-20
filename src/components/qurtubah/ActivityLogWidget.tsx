'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, FileText, Clock, ChevronLeft,
  Activity as ActivityIcon, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActivityLogEntry } from './types';

// ============ Action Icons Map ============
const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-3.5 w-3.5" />,
  update: <Pencil className="h-3.5 w-3.5" />,
  delete: <Trash2 className="h-3.5 w-3.5" />,
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const actionLabels: Record<string, string> = {
  create: 'إنشاء',
  update: 'تحديث',
  delete: 'حذف',
};

const entityTypeIcons: Record<string, React.ReactNode> = {
  evidence: <FileText className="h-4 w-4" />,
  indicator: <ActivityIcon className="h-4 w-4" />,
  standard: <ActivityIcon className="h-4 w-4" />,
  field: <ActivityIcon className="h-4 w-4" />,
};

const entityTypeLabels: Record<string, string> = {
  evidence: 'شاهد',
  indicator: 'مؤشر',
  standard: 'معيار',
  field: 'مجال',
};

// ============ Relative Time Helper ============
function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'منذ يوم';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}

// ============ Activity Log Component ============
export function ActivityLogWidget() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const url = filterType && filterType !== 'all'
          ? `/api/activity?limit=${showAll ? 100 : 20}&entityType=${filterType}`
          : `/api/activity?limit=${showAll ? 100 : 20}`;
        const res = await fetch(url);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setActivities(data.activities || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching activity log:', error);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [filterType, showAll, refreshKey]);

  const displayItems = showAll ? activities : activities.slice(0, 8);

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-teal-500" />
            سجل النشاطات
            <Badge variant="secondary" className="text-[10px]">{total}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 text-xs w-auto min-w-[100px] border-sky-200 dark:border-slate-700 dark:bg-slate-800">
                <SelectValue placeholder="تصفية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="evidence">الشواهد</SelectItem>
                <SelectItem value="indicator">المؤشرات</SelectItem>
                <SelectItem value="standard">المعايير</SelectItem>
                <SelectItem value="field">المجالات</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-sky-400 dark:text-sky-500">
            <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لا توجد نشاطات مسجلة بعد</p>
            <p className="text-xs mt-1">ستظهر النشاطات هنا عند إضافة أو تعديل أو حذف الشواهد</p>
          </div>
        ) : (
          <>
            {/* Timeline connector */}
            <div className="absolute right-[19px] top-3 bottom-3 w-0.5 bg-sky-200/60 dark:bg-slate-700/60" />
            <div className="space-y-2">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-sky-50/50 dark:bg-slate-800/50 hover:bg-sky-100/50 dark:hover:bg-slate-700/50 transition-colors relative"
                >
                  {/* Action Icon */}
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900 ${actionColors[item.action] || 'bg-slate-100 text-slate-600'}`}>
                    {actionIcons[item.action] || <ActivityIcon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">{item.entityName}</span>
                      <Badge variant="outline" className={`text-[9px] py-0 px-1.5 ${actionColors[item.action]}`}>
                        {actionLabels[item.action] || item.action}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-sky-200 dark:border-slate-600 text-sky-600 dark:text-sky-400">
                        {entityTypeLabels[item.entityType] || item.entityType}
                      </Badge>
                    </div>
                    {item.details && (
                      <p className="text-xs text-sky-500 dark:text-sky-400 mt-0.5 truncate">{item.details}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {item.userName && (
                        <span className="text-[10px] text-sky-400 dark:text-sky-500 flex items-center gap-0.5">
                          👤 {item.userName}
                        </span>
                      )}
                      <span className="text-[10px] text-sky-400 dark:text-sky-500 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {activities.length > 8 && (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-sky-600 dark:text-sky-400 gap-1"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'عرض أقل' : `عرض الكل (${total})`}
                  <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
