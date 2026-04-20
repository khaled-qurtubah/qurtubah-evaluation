'use client';

import React, { useState } from 'react';
import {
  Building2, Search, X, ChevronLeft, CheckCircle2, AlertCircle,
  Circle, Eye, Upload, Trophy, Clock, BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from './CircularProgress';
import { OverallProgressCard } from './OverallProgressCard';
import { ProgressMilestones } from './ProgressMilestones';
import { HorizontalBarChart, DonutChart, CompletionStatusGrid } from './Charts';
import { RecentActivity } from './RecentActivity';
import { DomainComparisonTable } from './DomainComparisonTable';
import { DomainRadarChart } from './DomainRadarChart';
import { QuickStatsWidget } from './QuickStatsWidget';
import { domainBarColors, domainGradients, iconMap } from './constants';
import type { FieldWithDetails, ProgressData } from './types';

// ============ Home Page Component ============
export function HomePage({
  fields,
  overallProgress,
  onFieldClick,
  onRefresh,
}: {
  fields: FieldWithDetails[];
  overallProgress: ProgressData | null;
  onFieldClick: (id: string) => void;
  onRefresh?: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFields = fields.filter((f) =>
    f.name.includes(searchTerm) || (f.description && f.description.includes(searchTerm))
  );

  const totalEvidence = fields.reduce((sum, f) => sum + f.totalUploaded, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Summary Stats Banner */}
      {overallProgress && (
        <div className="mb-6 py-1.5 px-4 rounded-lg bg-gradient-to-l from-sky-100 via-sky-50 to-sky-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 border border-sky-200/50 dark:border-slate-700/50 animate-fade-in">
          <div className="flex items-center justify-center gap-3 sm:gap-5 text-xs text-sky-700 dark:text-sky-300 flex-wrap">
            <span><strong>{overallProgress.totalFields}</strong> مجالات</span>
            <span className="text-sky-300 dark:text-slate-600">•</span>
            <span><strong>11</strong> معيار</span>
            <span className="text-sky-300 dark:text-slate-600">•</span>
            <span><strong>{overallProgress.totalIndicators}</strong> مؤشر</span>
            <span className="text-sky-300 dark:text-slate-600">•</span>
            <span><strong>{overallProgress.completedIndicators}</strong> مكتمل</span>
            <span className="text-sky-300 dark:text-slate-600">•</span>
            <span><strong>{overallProgress.progress}%</strong> إنجاز</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in relative">
        {/* Floating decorative shapes */}
        <div className="floating-shape bg-sky-400 w-16 h-16 top-4 right-[10%] hidden sm:block" style={{ animationDelay: '0s' }} />
        <div className="floating-shape diamond bg-cyan-400 w-10 h-10 top-12 left-[8%] hidden sm:block" style={{ animationDelay: '1s' }} />
        <div className="floating-shape bg-amber-400 w-8 h-8 bottom-0 right-[20%] hidden sm:block" style={{ animationDelay: '2s' }} />
        <div className="floating-shape diamond bg-teal-400 w-12 h-12 bottom-4 left-[15%] hidden sm:block" style={{ animationDelay: '3s' }} />
        <div className="floating-shape bg-sky-300 w-6 h-6 top-0 left-[40%] hidden sm:block" style={{ animationDelay: '4s' }} />
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-20 w-20 object-contain drop-shadow-lg animate-float" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-shadow-subtle">
          <span className="gradient-text">نظام تقويم التعليم</span>
        </h2>
        <p className="text-sky-600 dark:text-sky-400 text-sm sm:text-base mb-1">
          مدارس قرطبة الأهلية – مجمع أبحر
        </p>
        <p className="text-amber-600 dark:text-amber-400 text-xs font-medium mb-3">
          معايير هيئة تقويم التعليم 2026
        </p>
        {/* Pulsing dot - active system indicator */}
        <div className="flex items-center justify-center gap-2">
          <span className="pulsing-dot text-xs text-emerald-600 dark:text-emerald-400 font-medium">نظام نشط</span>
        </div>
      </div>

      {/* Overall Progress Card */}
      {overallProgress && (
        <OverallProgressCard overallProgress={overallProgress} onRefresh={onRefresh} fields={fields} />
      )}

      {/* Progress Milestones */}
      {overallProgress && (
        <ProgressMilestones progress={overallProgress.progress} />
      )}

      {/* Search Bar */}
      <div className="mb-6 animate-fade-in">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في المجالات..."
            className="pr-9 text-center dark:bg-slate-800 dark:border-slate-700 search-glow"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Field Cards Grid */}
      <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 mb-6 animate-fade-in heading-decorated">مجالات التقويم</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFields.map((field, index) => {
          const originalIndex = fields.indexOf(field);
          const IconComponent = iconMap[field.icon || 'Building2'] || Building2;
          const colors = domainGradients[String(originalIndex % 4)] || domainGradients['0'];
          return (
            <Card
              key={field.id}
              className={`cursor-pointer domain-card-hover card-hover-shimmer transition-all duration-300 border-sky-200 dark:border-slate-700 hover:border-sky-400 group overflow-hidden animate-fade-in stagger-${index + 1} relative`}
              onClick={() => onFieldClick(field.id)}
              style={{ ['--domain-color' as string]: domainBarColors[originalIndex % 4] }}
            >
              <div className={`h-2 bg-gradient-to-l ${colors.from} ${colors.to} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 10px)' }} />
              </div>
              {/* Subtle hover glow matching domain color */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: `0 0 30px ${domainBarColors[originalIndex % 4]}20, 0 0 60px ${domainBarColors[originalIndex % 4]}10` }} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.iconText} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-sky-900 dark:text-sky-100">{field.name}</CardTitle>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${colors.text} border-current/20`}>
                          {field.totalUploaded}/{field.totalRequired} شاهد
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-sky-500 dark:text-sky-400 mt-0.5">
                        {field.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircularProgress value={field.progress} size={40} strokeWidth={3} />
                    <ChevronLeft className="h-5 w-5 text-sky-400 group-hover:text-sky-600 group-hover:-translate-x-1 transition-all mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <Progress value={field.progress} className={`h-2.5 mb-3 domain-card-progress progress-color-${['sky', 'teal', 'amber', 'emerald'][originalIndex % 4]} progress-animated ${field.progress === 100 ? 'progress-complete' : ''}`} />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className={`domain-card-stats ${colors.iconBg} ${colors.text}`}>
                      {field.standardsCount} معايير
                    </span>
                    <span className={`domain-card-stats ${colors.iconBg} ${colors.text}`}>
                      {field.indicatorsCount} مؤشرات
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {field.progress === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : field.progress > 0 ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-sky-300" />
                    )}
                    <span className={`font-bold ${
                      field.progress === 100 ? 'gradient-text-emerald completion-badge-gold px-2 py-0.5 rounded-full text-xs' :
                      field.progress >= 50 ? 'gradient-text-gold completion-badge-silver px-2 py-0.5 rounded-full text-xs' :
                      field.progress > 0 ? 'gradient-text completion-badge-bronze px-2 py-0.5 rounded-full text-xs' : 'text-sky-400'
                    }`}>
                      {field.progress}%
                    </span>
                    {/* Indicator Completion Badge */}
                    {field.progress === 100 ? (
                      <Badge className="bg-amber-500 text-white gap-1 text-[10px] px-1.5 py-0 shrink-0">
                        <Trophy className="h-3 w-3" />
                        مكتمل
                      </Badge>
                    ) : field.completedIndicators > 0 && (field.completedIndicators / field.indicatorsCount) >= 0.5 ? (
                      <Badge className="bg-slate-400 text-white gap-1 text-[10px] px-1.5 py-0 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        جيد
                      </Badge>
                    ) : field.completedIndicators > 0 ? (
                      <Badge className="bg-amber-700 text-white gap-1 text-[10px] px-1.5 py-0 shrink-0">
                        <Clock className="h-3 w-3" />
                        قيد التقدم
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {/* Quick action button - visible on hover */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full gap-2 ${colors.text} border-current/30 hover:bg-sky-50 dark:hover:bg-slate-800 btn-detail-pulse touch-target`}
                    onClick={(e) => { e.stopPropagation(); onFieldClick(field.id); }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    عرض التفاصيل
                  </Button>
                </div>
                {/* View details overlay hint on hover */}
                <div className="view-details-overlay text-white text-center text-sm font-medium py-2" style={{ background: `linear-gradient(to top, ${domainBarColors[originalIndex % 4]}dd, transparent)` }}>
                  عرض التفاصيل ←
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredFields.length === 0 && searchTerm && (
          <div className="col-span-2 text-center py-12 text-sky-400 dark:text-sky-500">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد نتائج مطابقة لـ &quot;{searchTerm}&quot;</p>
          </div>
        )}
      </div>

      {/* Domain Comparison Table */}
      <div className="mt-10">
        <DomainComparisonTable fields={fields} />
      </div>

      {/* Data Visualization Charts Section */}
      {overallProgress && (
        <div className="mt-6 sm:mt-10 space-y-4 sm:space-y-6 px-0 sm:px-0">
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 animate-fade-in heading-decorated">التحليل البصري</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <HorizontalBarChart fields={fields} />
            <div className="flex justify-center lg:justify-start">
              <DonutChart fields={fields} totalEvidence={totalEvidence} />
            </div>
          </div>
          <CompletionStatusGrid fields={fields} />
        </div>
      )}

      {/* Domain Radar Chart */}
      <div className="mt-6 sm:mt-10">
        <DomainRadarChart fields={fields} />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-10">
        <RecentActivity fields={fields} onFieldClick={onFieldClick} />
      </div>

      {/* Statistics Section */}
      {overallProgress && (
        <div className="mt-10 animate-slide-up">
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 mb-4 heading-decorated">إحصائيات سريعة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift stats-card-enhanced">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <BarChart3 className="h-5 w-5 text-sky-600" />
              </div>
              <p className="text-2xl font-bold gradient-text stat-value-pop">{overallProgress.totalRequired}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">الشواهد المطلوبة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift stats-card-enhanced accent-emerald">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <Upload className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold gradient-text-emerald stat-value-pop">{overallProgress.totalUploaded}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">الشواهد المرفوعة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift stats-card-enhanced accent-amber">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold gradient-text-gold stat-value-pop">{overallProgress.completedIndicators}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">مؤشرات مكتملة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift stats-card-enhanced accent-teal">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <Trophy className="h-5 w-5 text-sky-600" />
              </div>
              <p className="text-2xl font-bold gradient-text stat-value-pop">{overallProgress.progress}%</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Stats Widget (Floating) */}
      <QuickStatsWidget overallProgress={overallProgress} />
    </div>
  );
}
