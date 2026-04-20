'use client';

import React, { useState } from 'react';
import {
  Building2, GraduationCap, FileText, Upload,
  LayoutDashboard, BarChart3, CheckCircle2,
  Loader2, AlertCircle, FileJson, Printer, Trash, FileSpreadsheet, Trophy,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { CircularProgress } from './CircularProgress';
import { PDFReportGenerator } from './PDFReportGenerator';
import { ActivityLogWidget } from './ActivityLogWidget';
import { FieldsManager } from './FieldsManager';
import { StandardsManager } from './StandardsManager';
import { IndicatorsManager } from './IndicatorsManager';
import { EvidenceManager } from './EvidenceManager';
import { StatisticsPanel } from './StatisticsPanel';
import { domainBarColors, iconMap, statusLabels, priorityLabels } from './constants';
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

  // Export Evidence to Excel/CSV with Arabic headers
  const handleExportExcel = async () => {
    try {
      const evidenceRes = await fetch('/api/evidence');
      if (!evidenceRes.ok) {
        toast.error('فشل جلب بيانات الشواهد');
        return;
      }
      const evidenceList: any[] = await evidenceRes.json();

      const BOM = '\uFEFF';
      const headers = ['المجال', 'المعيار', 'المؤشر', 'اسم الشاهد', 'الحالة', 'الأولوية', 'الرابط', 'التعليقات', 'تاريخ الإنشاء'];
      const rows = evidenceList.map((ev) => [
        ev.indicator?.standard?.field?.name || '',
        ev.indicator?.standard?.name || '',
        ev.indicator?.name || '',
        ev.name || '',
        statusLabels[ev.status] || 'مسودة',
        priorityLabels[ev.priority] || 'متوسط',
        ev.link || '',
        ev.comments || '',
        new Date(ev.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }),
      ]);

      const csvContent = BOM + [headers, ...rows].map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '\u0634\u0648\u0627\u0647\u062F_\u0627\u0644\u062A\u0642\u0648\u064A\u0645.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تصدير Excel بنجاح');
    } catch {
      toast.error('فشل تصدير Excel');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 text-sky-700 dark:text-sky-300 shadow-sm hover:shadow-md transition-shadow">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-sky-900 dark:text-sky-100 heading-decorated">لوحة التحكم</h2>
            <p className="text-sm text-sky-600 dark:text-sky-400">إدارة المجالات والمعايير والمؤشرات والشواهد</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print flex-wrap">
          <Button variant="outline" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>تصدير Excel</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200 border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>تصدير CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600" onClick={handleImportJSON}>
            <Upload className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>استيراد بيانات</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>تصدير JSON</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400" onClick={handlePrint}>
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span>طباعة التقرير</span>
          </Button>
          <PDFReportGenerator fields={fields} overallProgress={{ totalFields: fields.length, totalIndicators, completedIndicators, totalRequired, totalUploaded, progress: overallProgressVal, fields: [] }} />
          <Button variant="destructive" size="sm" className="gap-2 btn-press hover:shadow-md transition-all duration-200" onClick={() => setResetDialogOpen(true)}>
            <Trash className="h-4 w-4" />
            <span>إعادة تعيين</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Dashboard Visual Summary */}
      <Card className="mb-6 border-sky-200 dark:border-slate-700 overflow-hidden animate-slide-up gradient-border glow-sky-subtle hover:shadow-lg transition-shadow duration-300">
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
                  <div key={field.id} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-sky-50/80 to-sky-100/50 dark:from-slate-800/50 dark:to-slate-800/30 hover:shadow-md transition-shadow duration-200 cursor-default">
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

          {/* Quick Stats with Gradient Backgrounds */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/70 dark:from-slate-800 dark:to-slate-800/80 text-center card-lift hover:shadow-md transition-shadow duration-200">
              <Building2 className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{fields.length}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المجالات</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/70 dark:from-slate-800 dark:to-slate-800/80 text-center card-lift hover:shadow-md transition-shadow duration-200">
              <GraduationCap className="h-5 w-5 text-teal-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{totalStandards}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المعايير</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-slate-800 dark:to-slate-800/80 text-center card-lift hover:shadow-md transition-shadow duration-200">
              <BarChart3 className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-gold">{totalIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المؤشرات</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 dark:from-slate-800 dark:to-slate-800/80 text-center card-lift hover:shadow-md transition-shadow duration-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-emerald">{completedIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">مكتملة</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/70 dark:from-slate-800 dark:to-slate-800/80 text-center col-span-2 sm:col-span-1 card-lift hover:shadow-md transition-shadow duration-200">
              <Trophy className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{overallProgressVal}%</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-6 mb-6 h-auto relative">
          <TabsTrigger value="fields" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-sky-500 data-[state=active]:to-sky-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">المجالات</span>
          </TabsTrigger>
          <TabsTrigger value="standards" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">المعايير</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">المؤشرات</span>
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">الشواهد</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-violet-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">النشاطات</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5 text-xs sm:text-sm py-2.5 data-[state=active]:bg-gradient-to-b data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-0 data-[state=active]:after:w-3/4 after:bg-white after:rounded-full after:transition-all after:duration-300">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">الإحصائيات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="tab-content-animate border-r-4 border-sky-400 dark:border-sky-600 pr-4">
          <FieldsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="standards" className="tab-content-animate border-r-4 border-teal-400 dark:border-teal-600 pr-4">
          <StandardsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="indicators" className="tab-content-animate border-r-4 border-amber-400 dark:border-amber-600 pr-4">
          <IndicatorsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="evidence" className="tab-content-animate border-r-4 border-emerald-400 dark:border-emerald-600 pr-4">
          <EvidenceManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="activity" className="tab-content-animate border-r-4 border-violet-400 dark:border-violet-600 pr-4">
          <ActivityLogWidget />
        </TabsContent>
        <TabsContent value="statistics" className="tab-content-animate border-r-4 border-rose-400 dark:border-rose-600 pr-4">
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
