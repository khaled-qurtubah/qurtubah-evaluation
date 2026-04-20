'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Building2, GraduationCap, Plus, Pencil, Trash2, FileText, Link2, Upload,
  LayoutDashboard, BarChart3, CheckCircle2, Search, Download, Loader2,
  AlertCircle, ExternalLink, FileJson, Printer, Trash, FileSpreadsheet, Trophy,
  Target, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCheck, ClipboardList,
  Activity,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CircularProgress } from './CircularProgress';
import { PDFReportGenerator } from './PDFReportGenerator';
import { ActivityLogWidget } from './ActivityLogWidget';
import { domainBarColors, domainBarBgColors, iconMap, statusLabels, statusBadgeClasses, priorityLabels, priorityColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Dashboard View ============
export function DashboardView({
  fields,
  onRefresh,
}: {
  fields: FieldWithDetails[];
  onRefresh: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState('fields');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  // Compute dashboard stats
  const totalStandards = fields.reduce((sum, f) => sum + f.standardsCount, 0);
  const totalIndicators = fields.reduce((sum, f) => sum + f.indicatorsCount, 0);
  const totalRequired = fields.reduce((sum, f) => sum + f.totalRequired, 0);
  const totalUploaded = fields.reduce((sum, f) => sum + f.totalUploaded, 0);
  const completedIndicators = fields.reduce((sum, f) => sum + f.completedIndicators, 0);
  const overallProgressVal = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

  // Enhanced Print Report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Calculate evidence status and priority distributions
    const allEv = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences)));
    const draftCount = allEv.filter((e) => e.status === 'draft').length;
    const submittedCount = allEv.filter((e) => e.status === 'submitted').length;
    const approvedCount = allEv.filter((e) => e.status === 'approved').length;
    const highPriority = allEv.filter((e) => e.priority === 'high').length;
    const mediumPriority = allEv.filter((e) => e.priority === 'medium').length;
    const lowPriority = allEv.filter((e) => e.priority === 'low').length;

    const fieldRows = fields.map((f) => `
      <tr>
        <td style="padding:8px;border:1px solid #e2e8f0;font-weight:bold;">${f.name}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${f.standardsCount}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${f.indicatorsCount}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${f.completedIndicators}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${f.totalUploaded} / ${f.totalRequired}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;color:${f.progress >= 80 ? '#10b981' : f.progress >= 50 ? '#f59e0b' : '#0ea5e9'}">${f.progress}%</td>
      </tr>
    `).join('');

    const standardRows = fields.flatMap((f) =>
      f.standards.map((s) => {
        const sIndicators = s.indicators;
        const sRequired = sIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
        const sUploaded = sIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
        const sCompleted = sIndicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length;
        const sProgress = sRequired > 0 ? Math.round((sUploaded / sRequired) * 100) : 0;
        return `
          <tr>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;">${s.name}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${f.name}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sIndicators.length}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sCompleted}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sUploaded} / ${sRequired}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:12px;text-align:center;font-weight:bold;">${sProgress}%</td>
          </tr>
        `;
      })
    ).join('');

    // Get logo as base64 for print
    let logoDataUri = '';
    try {
      logoDataUri = '/logo.png';
    } catch {
      // ignore
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تقويم التعليم - مدارس قرطبة</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 30px; color: #1e293b; }
          h1 { color: #0c4a6e; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; }
          h2 { color: #0369a1; margin-top: 30px; }
          h3 { color: #0c4a6e; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f0f9ff; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0c4a6e; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
          .header img { height: 60px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-box { background: #f0f9ff; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #bae6fd; }
          .stat-box .value { font-size: 28px; font-weight: bold; color: #0284c7; }
          .stat-box .label { font-size: 12px; color: #64748b; }
          .progress-bar { height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #0284c7); border-radius: 10px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
          .summary-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
          .summary-item .count { font-size: 22px; font-weight: bold; }
          .summary-item .lbl { font-size: 11px; color: #64748b; }
          .signature-section { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
          .signature-line { display: inline-block; width: 200px; border-bottom: 1px solid #1e293b; margin-top: 40px; }
          @page { margin: 1.5cm; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
          }
          footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #94a3b8; padding: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoDataUri}" alt="شعار مدارس قرطبة" onerror="this.style.display='none'" />
          <div>
            <h1 style="margin:0;border:none;padding:0;">تقرير تقويم التعليم</h1>
            <p style="color:#64748b;margin:5px 0;">مدارس قرطبة الأهلية – مجمع أبحر</p>
            <p style="color:#d97706;font-size:12px;">معايير هيئة تقويم التعليم 2026 | تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box"><div class="value">${overallProgressVal}%</div><div class="label">نسبة الإنجاز</div></div>
          <div class="stat-box"><div class="value">${totalIndicators}</div><div class="label">المؤشرات</div></div>
          <div class="stat-box"><div class="value">${completedIndicators}</div><div class="label">مكتملة</div></div>
          <div class="stat-box"><div class="value">${totalUploaded}</div><div class="label">الشواهد</div></div>
        </div>

        <div class="progress-bar"><div class="progress-fill" style="width:${overallProgressVal}%"></div></div>

        <h2>ملخص حالات الشواهد</h2>
        <div class="summary-grid">
          <div class="summary-item"><div class="count" style="color:#94a3b8">${draftCount}</div><div class="lbl">مسودة</div></div>
          <div class="summary-item"><div class="count" style="color:#f59e0b">${submittedCount}</div><div class="lbl">مقدّم</div></div>
          <div class="summary-item"><div class="count" style="color:#10b981">${approvedCount}</div><div class="lbl">معتمد</div></div>
        </div>

        <h3>توزيع الأولويات</h3>
        <div class="summary-grid">
          <div class="summary-item"><div class="count" style="color:#ef4444">${highPriority}</div><div class="lbl">أولوية مرتفعة</div></div>
          <div class="summary-item"><div class="count" style="color:#f59e0b">${mediumPriority}</div><div class="lbl">أولوية متوسطة</div></div>
          <div class="summary-item"><div class="count" style="color:#94a3b8">${lowPriority}</div><div class="lbl">أولوية منخفضة</div></div>
        </div>

        <h2>تقدم المجالات</h2>
        <table>
          <thead>
            <tr>
              <th>المجال</th>
              <th>المعايير</th>
              <th>المؤشرات</th>
              <th>مكتملة</th>
              <th>الشواهد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>${fieldRows}</tbody>
        </table>

        <h2>تفاصيل المعايير</h2>
        <table>
          <thead>
            <tr>
              <th>المعيار</th>
              <th>المجال</th>
              <th>المؤشرات</th>
              <th>مكتملة</th>
              <th>الشواهد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>${standardRows}</tbody>
        </table>

        <div class="signature-section">
          <h3>تقرير مقدم من</h3>
          <p style="color:#64748b;font-size:13px;">التاريخ: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="color:#64748b;font-size:13px;">المسمى الوظيفي: ............................</p>
          <p style="color:#64748b;font-size:13px;">الاسم: ............................</p>
          <p style="margin-top:30px;">التوقيع: <span class="signature-line"></span></p>
        </div>

        <div style="margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;">
          نظام تقويم التعليم © ${new Date().getFullYear()} مدارس قرطبة الأهلية
        </div>
        <footer>صفحة <span id="page-num"></span></footer>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.document.body.style.counterReset = 'page';
    setTimeout(() => printWindow.print(), 500);
  };

  // Export JSON
  const handleExportJSON = async () => {
    try {
      const [fieldsRes, standardsRes, indicatorsRes, evidenceRes] = await Promise.all([
        fetch('/api/fields'),
        fetch('/api/standards'),
        fetch('/api/indicators'),
        fetch('/api/evidence'),
      ]);
      const exportData = {
        exportDate: new Date().toISOString(),
        school: 'مدارس قرطبة الأهلية',
        system: 'نظام تقويم التعليم - معايير هيئة تقويم التعليم 2026',
        summary: { totalFields: fields.length, totalStandards, totalIndicators, completedIndicators, totalRequired, totalUploaded, overallProgress: overallProgressVal },
        fields: fieldsRes.ok ? await fieldsRes.json() : [],
        standards: standardsRes.ok ? await standardsRes.json() : [],
        indicators: indicatorsRes.ok ? await indicatorsRes.json() : [],
        evidence: evidenceRes.ok ? await evidenceRes.json() : [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qurtubah-evaluation-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تصدير البيانات بنجاح');
    } catch {
      toast.error('فشل تصدير البيانات');
    }
  };

  const handleImportJSON = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.fields || !Array.isArray(data.fields)) {
          toast.error('ملف غير صالح - يجب أن يحتوي على بيانات المجالات');
          return;
        }

        const confirmed = window.confirm(
          `سيتم استيراد ${data.fields?.length || 0} مجال و ${data.evidence?.length || 0} شاهد.\nهذا الإجراء سيضيف البيانات الموجودة في الملف. هل تريد المتابعة؟`
        );

        if (!confirmed) return;

        let importedCount = 0;

        // Import evidence items if they exist
        if (data.evidence && Array.isArray(data.evidence)) {
          for (const ev of data.evidence) {
            if (ev.name && ev.indicatorId) {
              try {
                const res = await fetch('/api/evidence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: ev.name,
                    link: ev.link || null,
                    fileName: ev.fileName || null,
                    filePath: ev.filePath || null,
                    indicatorId: ev.indicatorId,
                  }),
                });
                if (res.ok) importedCount++;
              } catch {
                // Skip failed imports
              }
            }
          }
        }

        toast.success(`تم استيراد ${importedCount} شاهد بنجاح`);
        await onRefresh();
      } catch {
        toast.error('فشل قراءة ملف الاستيراد');
      }
    };
    input.click();
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const evidenceRes = await fetch('/api/evidence');
      if (!evidenceRes.ok) {
        toast.error('فشل جلب بيانات الشواهد');
        return;
      }
      const evidenceList: any[] = await evidenceRes.json();

      const BOM = '\uFEFF';
      const headers = ['اسم الشاهد', 'الوصف', 'الحالة', 'الأهمية', 'الرابط', 'الملف', 'المؤشر', 'المعيار', 'المجال', 'تاريخ الإنشاء'];
      const rows = evidenceList.map((ev) => [
        ev.name || '',
        ev.description || '',
        statusLabels[ev.status] || 'مسودة',
        priorityLabels[ev.priority] || 'متوسط',
        ev.link || '',
        ev.fileName || '',
        ev.indicator?.name || '',
        ev.indicator?.standard?.name || '',
        ev.indicator?.standard?.field?.name || '',
        new Date(ev.createdAt).toLocaleDateString('ar-SA'),
      ]);

      const csvContent = BOM + [headers, ...rows].map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qurtubah-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تصدير CSV بنجاح');
    } catch {
      toast.error('فشل تصدير CSV');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 text-sky-700 dark:text-sky-300 shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-sky-900 dark:text-sky-100 heading-decorated">لوحة التحكم</h2>
            <p className="text-sm text-sky-600 dark:text-sky-400">إدارة المجالات والمعايير والمؤشرات والشواهد</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4" />
            تصدير CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handleImportJSON}>
            <Upload className="h-4 w-4" />
            استيراد بيانات
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4" />
            تصدير JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            طباعة التقرير
          </Button>
          <PDFReportGenerator fields={fields} overallProgress={{ totalFields: fields.length, totalIndicators, completedIndicators, totalRequired, totalUploaded, progress: overallProgressVal, fields: [] }} />
          <Button variant="destructive" size="sm" className="gap-2 btn-press" onClick={() => setResetDialogOpen(true)}>
            <Trash className="h-4 w-4" />
            إعادة تعيين البيانات
          </Button>
        </div>
      </div>

      {/* Enhanced Dashboard Visual Summary */}
      <Card className="mb-6 border-sky-200 dark:border-slate-700 overflow-hidden animate-slide-up gradient-border glow-sky-subtle">
        <CardHeader className="pb-3 bg-gradient-to-l from-sky-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
            <span className="pulsing-dot">ملخص بصري</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Overall Progress Ring */}
            <div className="relative shrink-0">
              <CircularProgress value={overallProgressVal} size={120} strokeWidth={8} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-sky-900 dark:text-sky-100">{overallProgressVal}%</span>
                <span className="text-[10px] text-sky-500 dark:text-sky-400">الإنجاز الكلي</span>
              </div>
            </div>

            {/* Domain Progress Rings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              {fields.map((field, i) => {
                const fColor = domainBarColors[i % 4];
                const IconComp = iconMap[field.icon || 'Building2'] || Building2;
                return (
                  <div key={field.id} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-sky-50/50 dark:bg-slate-800/50">
                    <div className="relative">
                      <CircularProgress value={field.progress} size={60} strokeWidth={4} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{ color: fColor }}>{field.progress}%</span>
                      </div>
                    </div>
                    <IconComp className="h-4 w-4 mt-1" style={{ color: fColor }} />
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 text-center leading-tight">{field.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats with Trend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800 text-center card-lift">
              <Building2 className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{fields.length}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المجالات</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-slate-800 text-center card-lift">
              <GraduationCap className="h-5 w-5 text-teal-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{totalStandards}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المعايير</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-800 text-center card-lift">
              <BarChart3 className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-gold">{totalIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المؤشرات</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-800 text-center card-lift">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-emerald">{completedIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">مكتملة</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800 text-center col-span-2 sm:col-span-1 card-lift">
              <Trophy className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{overallProgressVal}%</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-6 mb-6 h-auto">
          <TabsTrigger value="fields" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">المجالات</span>
          </TabsTrigger>
          <TabsTrigger value="standards" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">المعايير</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">المؤشرات</span>
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الشواهد</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">النشاطات</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5 text-xs sm:text-sm py-2 data-[state=active]:bg-sky-600 data-[state=active]:text-white transition-all">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">الإحصائيات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="tab-content-animate">
          <FieldsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="standards" className="tab-content-animate">
          <StandardsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="indicators" className="tab-content-animate">
          <IndicatorsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="evidence" className="tab-content-animate">
          <EvidenceManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="activity" className="tab-content-animate">
          <ActivityLogWidget />
        </TabsContent>
        <TabsContent value="statistics" className="tab-content-animate">
          <StatisticsPanel fields={fields} />
        </TabsContent>
      </Tabs>

      {/* Reset Data AlertDialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) setResetConfirmText(''); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              تحذير: إعادة تعيين البيانات
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-red-600 dark:text-red-400 font-medium">
                سيتم حذف جميع الشواهد نهائياً! لا يمكن التراجع عن هذا الإجراء.
              </p>
              <p>للتأكيد، اكتب <strong>تأكيد</strong> في الحقل أدناه:</p>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="اكتب تأكيد هنا"
                className="border-red-300 dark:border-red-800 focus:border-red-500"
                dir="rtl"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setResetConfirmText('')}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetConfirmText !== 'تأكيد' || resetting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                setResetting(true);
                try {
                  const allEvidence = fields.flatMap((f) => f.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences)));
                  for (const ev of allEvidence) {
                    await fetch(`/api/evidence/${ev.id}`, { method: 'DELETE' });
                  }
                  toast.success('تم حذف جميع الشواهد بنجاح');
                  await onRefresh();
                } catch {
                  toast.error('فشل في إعادة تعيين البيانات');
                } finally {
                  setResetting(false);
                  setResetDialogOpen(false);
                  setResetConfirmText('');
                }
              }}
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حذف جميع الشواهد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ Fields Manager ============
function FieldsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formIcon, setFormIcon] = useState('Building2');

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormOrder('0');
    setFormIcon('Building2');
    setDialogOpen(true);
  };

  const openEdit = (field: FieldWithDetails) => {
    setEditing(field);
    setFormName(field.name);
    setFormDesc(field.description || '');
    setFormOrder(String(field.order));
    setFormIcon(field.icon || 'Building2');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/fields/${editing.id}` : '/api/fields';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          order: parseInt(formOrder) || 0,
          icon: formIcon,
        }),
      });
      if (res.ok) {
        toast.success(editing ? 'تم تحديث المجال' : 'تم إضافة المجال');
        setDialogOpen(false);
        await onRefresh();
      } else {
        toast.error('فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/fields/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف المجال');
        await onRefresh();
      } else {
        toast.error('فشل حذف المجال');
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">إدارة المجالات</h3>
        <Button size="sm" className="gap-1.5 btn-press shadow-sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          إضافة مجال
        </Button>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table className="table-zebra">
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-sky-50 to-sky-100/80 dark:from-slate-800 dark:to-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الأيقونة</TableHead>
              <TableHead className="text-right">الترتيب</TableHead>
              <TableHead className="text-right">المعايير</TableHead>
              <TableHead className="text-right">التقدم</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, i) => (
              <TableRow key={field.id} className="enhanced-table-row table-row-accent">
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium dark:text-sky-100">{field.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {React.createElement(iconMap[field.icon || 'Building2'] || Building2, { className: 'h-4 w-4 text-sky-600' })}
                    <span className="text-xs text-sky-500 dark:text-sky-400">{field.icon}</span>
                  </div>
                </TableCell>
                <TableCell>{field.order}</TableCell>
                <TableCell><Badge variant="secondary">{field.standardsCount}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={field.progress} className="h-2 w-16" />
                    <span className={`text-xs font-bold ${field.progress === 100 ? 'text-emerald-600' : 'text-sky-600'}`}>{field.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-sky-100 dark:hover:bg-slate-700" onClick={() => openEdit(field)}>
                      <Pencil className="h-4 w-4 text-sky-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteConfirm(field.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sky-400 py-8">
                  لا توجد مجالات بعد
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="table-pagination-footer">
          <span>{fields.length} مجالات</span>
          <span>إجمالي السجلات المعروضة</span>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المجال' : 'إضافة مجال جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المجال *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="أدخل اسم المجال" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="أدخل وصف المجال" />
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الأيقونة</Label>
              <Select value={formIcon} onValueChange={setFormIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Building2">إدارة (Building2)</SelectItem>
                  <SelectItem value="GraduationCap">تعليم (GraduationCap)</SelectItem>
                  <SelectItem value="Trophy">إنجاز (Trophy)</SelectItem>
                  <SelectItem value="School">بيئة (School)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المجال؟ سيتم حذف جميع المعايير والمؤشرات والشواهد المرتبطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ Standards Manager ============
function StandardsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [standards, setStandards] = useState<any[]>([]);
  const [loadingStandards, setLoadingStandards] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formFieldId, setFormFieldId] = useState('');

  const fetchStandards = useCallback(async () => {
    setLoadingStandards(true);
    try {
      const url = selectedFieldId && selectedFieldId !== 'all' 
        ? `/api/standards?fieldId=${selectedFieldId}` 
        : '/api/standards';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStandards(data);
      }
    } catch (error) {
      console.error('Error fetching standards:', error);
    }
    setLoadingStandards(false);
  }, [selectedFieldId]);

  useEffect(() => {
    fetchStandards();
  }, [fetchStandards]);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormOrder('0');
    setFormFieldId(selectedFieldId !== 'all' ? selectedFieldId : '');
    setDialogOpen(true);
  };

  const openEdit = (std: any) => {
    setEditing(std);
    setFormName(std.name);
    setFormDesc(std.description || '');
    setFormOrder(String(std.order));
    setFormFieldId(std.fieldId);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formFieldId) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/standards/${editing.id}` : '/api/standards';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          order: parseInt(formOrder) || 0,
          fieldId: formFieldId,
        }),
      });
      if (res.ok) {
        toast.success(editing ? 'تم تحديث المعيار' : 'تم إضافة المعيار');
        setDialogOpen(false);
        await fetchStandards();
        await onRefresh();
      } else {
        toast.error('فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/standards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف المعيار');
        await fetchStandards();
        await onRefresh();
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">إدارة المعايير</h3>
        <div className="flex items-center gap-2">
          <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر المجال" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المجالات</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            إضافة معيار
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table className="table-zebra">
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-sky-50 to-sky-100/80 dark:from-slate-800 dark:to-slate-900">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المجال</TableHead>
              <TableHead className="text-right">الترتيب</TableHead>
              <TableHead className="text-right">المؤشرات</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingStandards ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-sky-600" />
                </TableCell>
              </TableRow>
            ) : (
              standards.map((std, i) => (
                <TableRow key={std.id} className="enhanced-table-row table-row-accent">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium dark:text-sky-100">{std.name}</TableCell>
                  <TableCell className="text-sm text-sky-600 dark:text-sky-400">
                    {std.field?.name || fields.find(f => f.id === std.fieldId)?.name || '-'}
                  </TableCell>
                  <TableCell>{std.order}</TableCell>
                  <TableCell>{std.indicators?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-sky-100 dark:hover:bg-slate-700" onClick={() => openEdit(std)}>
                        <Pencil className="h-4 w-4 text-sky-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteConfirm(std.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loadingStandards && standards.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sky-400 py-8">
                  لا توجد معايير
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="table-pagination-footer">
          <span>{standards.length} معايير</span>
          <span>إجمالي السجلات المعروضة</span>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المعيار' : 'إضافة معيار جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المعيار *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="أدخل اسم المعيار" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="أدخل وصف المعيار" />
            </div>
            <div className="space-y-2">
              <Label>المجال *</Label>
              <Select value={formFieldId} onValueChange={setFormFieldId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجال" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || !formFieldId || submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المعيار؟ سيتم حذف جميع المؤشرات والشواهد المرتبطة.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ Indicators Manager ============
function IndicatorsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [selectedStandardId, setSelectedStandardId] = useState<string>('all');
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState('0');
  const [formRequiredEvidence, setFormRequiredEvidence] = useState('1');
  const [formStandardId, setFormStandardId] = useState('');

  // Get standards for selected field
  const availableStandards = selectedFieldId && selectedFieldId !== 'all'
    ? fields.find(f => f.id === selectedFieldId)?.standards || []
    : fields.flatMap(f => f.standards);

  const fetchIndicators = useCallback(async () => {
    setLoadingIndicators(true);
    try {
      const url = selectedStandardId && selectedStandardId !== 'all'
        ? `/api/indicators?standardId=${selectedStandardId}`
        : '/api/indicators';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIndicators(data);
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
    }
    setLoadingIndicators(false);
  }, [selectedStandardId]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  useEffect(() => {
    // Reset standard when field changes
    setSelectedStandardId('all');
  }, [selectedFieldId]);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormOrder('0');
    setFormRequiredEvidence('1');
    setFormStandardId(selectedStandardId !== 'all' ? selectedStandardId : '');
    setDialogOpen(true);
  };

  const openEdit = (ind: any) => {
    setEditing(ind);
    setFormName(ind.name);
    setFormDesc(ind.description || '');
    setFormOrder(String(ind.order));
    setFormRequiredEvidence(String(ind.requiredEvidence));
    setFormStandardId(ind.standardId);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formStandardId) return;
    setSubmitting(true);
    try {
      const url = editing ? `/api/indicators/${editing.id}` : '/api/indicators';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          order: parseInt(formOrder) || 0,
          requiredEvidence: parseInt(formRequiredEvidence) || 1,
          standardId: formStandardId,
        }),
      });
      if (res.ok) {
        toast.success(editing ? 'تم تحديث المؤشر' : 'تم إضافة المؤشر');
        setDialogOpen(false);
        await fetchIndicators();
        await onRefresh();
      } else {
        toast.error('فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/indicators/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف المؤشر');
        await fetchIndicators();
        await onRefresh();
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">إدارة المؤشرات</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="المجال" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المجالات</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStandardId} onValueChange={setSelectedStandardId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="المعيار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعايير</SelectItem>
              {availableStandards.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            إضافة مؤشر
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table className="table-zebra">
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-sky-50 to-sky-100/80 dark:from-slate-800 dark:to-slate-900">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المعيار</TableHead>
              <TableHead className="text-right">الشواهد المطلوبة</TableHead>
              <TableHead className="text-right">الشواهد المرفوعة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingIndicators ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-sky-600" />
                </TableCell>
              </TableRow>
            ) : (
              indicators.map((ind, i) => (
                <TableRow key={ind.id} className="enhanced-table-row table-row-accent">
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium max-w-xs truncate dark:text-sky-100">{ind.name}</TableCell>
                  <TableCell className="text-sm text-sky-600 dark:text-sky-400">
                    {ind.standard?.name || '-'}
                  </TableCell>
                  <TableCell><Badge variant="outline">{ind.requiredEvidence}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={ind.evidences?.length >= ind.requiredEvidence ? 'default' : 'secondary'}
                      className={`${ind.evidences?.length >= ind.requiredEvidence ? 'bg-emerald-600' : 'bg-amber-500'} transition-colors`}>
                      {ind.evidences?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-sky-100 dark:hover:bg-slate-700" onClick={() => openEdit(ind)}>
                        <Pencil className="h-4 w-4 text-sky-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteConfirm(ind.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loadingIndicators && indicators.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sky-400 py-8">
                  لا توجد مؤشرات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="table-pagination-footer">
          <span>{indicators.length} مؤشرات</span>
          <span>إجمالي السجلات المعروضة</span>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المؤشر' : 'إضافة مؤشر جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المؤشر *</Label>
              <Textarea value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="أدخل نص المؤشر" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="أدخل وصف المؤشر" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المعيار *</Label>
                <Select value={formStandardId} onValueChange={setFormStandardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعيار" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStandards.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>عدد الشواهد المطلوبة</Label>
                <Input type="number" value={formRequiredEvidence} onChange={(e) => setFormRequiredEvidence(e.target.value)} min="1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الترتيب</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={!formName.trim() || !formStandardId || submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المؤشر؟ سيتم حذف جميع الشواهد المرتبطة.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ Statistics Panel ============
function StatisticsPanel({ fields }: { fields: FieldWithDetails[] }) {
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

// ============ Evidence Manager ============
function EvidenceManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('submitted');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    
    (async () => {
      try {
        const res = await fetch('/api/evidence', { signal: controller.signal });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setEvidenceList(data);
        }
      } catch (error) {
        if (!cancelled) console.error('Error fetching evidence:', error);
      } finally {
        if (!cancelled) setLoadingEvidence(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshKey]);

  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch = ev.name.includes(searchTerm) ||
      ev.indicator?.name?.includes(searchTerm) ||
      ev.indicator?.standard?.name?.includes(searchTerm) ||
      ev.indicator?.standard?.field?.name?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allFilteredSelected = filteredEvidence.length > 0 && filteredEvidence.every((ev) => selectedIds.has(ev.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvidence.map((ev) => ev.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/evidence/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkStatus }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(`تم تحديث حالة ${succeeded} شاهد إلى "${statusLabels[bulkStatus]}"`);
      setSelectedIds(new Set());
      setRefreshKey(k => k + 1);
      await onRefresh();
    } catch {
      toast.error('حدث خطأ أثناء التحديث');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الشاهد');
        setRefreshKey(k => k + 1);
        await onRefresh();
      }
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">جميع الشواهد</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في الشواهد..."
              className="pr-9 dark:bg-slate-800 dark:border-slate-700 search-glow"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] dark:bg-slate-800 dark:border-slate-700">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="submitted">مقدّم</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Toolbar - floating bottom */}
      {selectedIds.size > 0 && (
        <div className="action-toolbar mt-4">
          <span className="text-sm font-medium text-sky-800 dark:text-sky-200">
            تم تحديد {selectedIds.size} شاهد
          </span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-[120px] h-8 text-xs dark:bg-slate-700 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="submitted">مقدّم</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleBulkStatusChange}
            disabled={bulkProcessing}
          >
            {bulkProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            تطبيق
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-sky-600"
            onClick={() => setSelectedIds(new Set())}
          >
            إلغاء التحديد
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-sky-200 dark:border-slate-700 overflow-hidden shadow-sm max-h-[600px] overflow-y-auto">
        <Table className="table-zebra">
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-sky-50 to-sky-100/80 dark:from-slate-800 dark:to-slate-900 sticky top-0">
              <TableHead className="text-right w-10">
                <div className={`checkbox-anim ${allFilteredSelected ? 'checked' : ''}`}>
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="تحديد الكل"
                  />
                </div>
              </TableHead>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الشاهد</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الأهمية</TableHead>
              <TableHead className="text-right">المؤشر</TableHead>
              <TableHead className="text-right">المعيار</TableHead>
              <TableHead className="text-right">المجال</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingEvidence ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-sky-600" />
                </TableCell>
              </TableRow>
            ) : (
              filteredEvidence.map((ev, i) => (
                <TableRow key={ev.id} className={`enhanced-table-row table-row-accent ${selectedIds.has(ev.id) ? 'bulk-select-row' : ''}`}>
                  <TableCell>
                    <div className={`checkbox-anim ${selectedIds.has(ev.id) ? 'checked' : ''}`}>
                      <Checkbox
                        checked={selectedIds.has(ev.id)}
                        onCheckedChange={() => toggleSelect(ev.id)}
                        aria-label={`تحديد ${ev.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium dark:text-sky-100">
                    <div>
                      <span>{ev.name}</span>
                      {ev.description && (
                        <p className="text-[11px] text-sky-500 dark:text-sky-400 truncate max-w-[180px]">{ev.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`${statusBadgeClasses[ev.status] || statusBadgeClasses.draft}`}>
                      {statusLabels[ev.status] || statusLabels.draft}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[ev.priority] || priorityColors.medium}`}>
                      {priorityLabels[ev.priority] || priorityLabels.medium}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-sky-600 dark:text-sky-400 max-w-[200px] truncate">
                    {ev.indicator?.name || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-sky-600 dark:text-sky-400">
                    {ev.indicator?.standard?.name || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-sky-600 dark:text-sky-400">
                    {ev.indicator?.standard?.field?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {ev.filePath && (
                        <Badge variant="outline" className="gap-1 text-xs border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                          <FileText className="h-3 w-3" />
                          ملف
                        </Badge>
                      )}
                      {ev.link && (
                        <Badge variant="outline" className="gap-1 text-xs border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                          <Link2 className="h-3 w-3" />
                          رابط
                        </Badge>
                      )}
                      {!ev.filePath && !ev.link && (
                        <Badge variant="secondary" className="text-xs">نص فقط</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {ev.link && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 btn-press" asChild>
                          <a href={ev.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-sky-600" />
                          </a>
                        </Button>
                      )}
                      {ev.filePath && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 btn-press" asChild>
                          <a href={ev.filePath} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 text-sky-600" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 btn-press hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setDeleteConfirm(ev.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loadingEvidence && filteredEvidence.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-sky-400 py-8">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد شواهد بعد'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="table-pagination-footer">
          <span>{filteredEvidence.length} شواهد</span>
          <span>إجمالي السجلات المعروضة</span>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الشاهد؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
