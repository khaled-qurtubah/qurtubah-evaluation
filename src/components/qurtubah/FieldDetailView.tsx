'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, FileText, Link2, Upload,
  CheckCircle2, Circle, BarChart3, Eye, Download, Loader2, Filter, ExternalLink,
  ClipboardList, Clock, TrendingUp, MessageSquare, X, StickyNote, CheckSquare, Square as SquareIcon,
  AlertTriangle, Printer,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CircularProgress } from './CircularProgress';
import { domainBarColors, domainGradients, iconMap, statusLabels, statusBadgeClasses, priorityLabels, priorityColors, evidencePriorityClasses } from './constants';
import { CommentCountBadge, CommentsSection } from './CommentsSection';
import type { Evidence, FieldWithDetails } from './types';

// Priority sort order: high=0, medium=1, low=2
const prioritySortOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

// Priority dot colors for visual indicators
const priorityDotColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
};

// ============ Field Detail View ============
export function FieldDetailView({
  field,
  fields,
  onBack,
  onRefresh,
  onNavigateToField,
}: {
  field: FieldWithDetails;
  fields: FieldWithDetails[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onNavigateToField?: (id: string) => void;
}) {
  const IconComponent = iconMap[field.icon || 'Building2'] || Building2;
  const domainColors = domainGradients[String(field.order - 1)] || domainGradients['0'];
  const [expandedStandard, setExpandedStandard] = useState<string | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [indicatorSearch, setIndicatorSearch] = useState('');

  // Feature A: Bulk Actions State
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<string>('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Feature C: Priority Filter State
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Feature D: Indicator Notes State
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesIndicatorId, setNotesIndicatorId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Form state
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceStatus, setEvidenceStatus] = useState('draft');
  const [evidencePriority, setEvidencePriority] = useState('medium');
  const [evidenceComments, setEvidenceComments] = useState('');
  const [evidenceDueDate, setEvidenceDueDate] = useState('');
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerFile, setPdfViewerFile] = useState<{ name: string; url: string } | null>(null);

  // Get all evidence in this field for bulk operations
  const allFieldEvidence = useMemo(() =>
    field.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences)),
    [field]
  );

  const openAddEvidence = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setEditingEvidence(null);
    setEvidenceName('');
    setEvidenceDescription('');
    setEvidenceLink('');
    setEvidenceFile(null);
    setEvidenceStatus('draft');
    setEvidencePriority('medium');
    setEvidenceComments('');
    setEvidenceDueDate('');
    setEvidenceDialogOpen(true);
  };

  const openEditEvidence = (evidence: Evidence) => {
    setSelectedIndicatorId(evidence.indicatorId);
    setEditingEvidence(evidence);
    setEvidenceName(evidence.name);
    setEvidenceDescription(evidence.description || '');
    setEvidenceLink(evidence.link || '');
    setEvidenceFile(null);
    setEvidenceStatus(evidence.status || 'draft');
    setEvidencePriority(evidence.priority || 'medium');
    setEvidenceComments(evidence.comments || '');
    setEvidenceDueDate(evidence.dueDate ? new Date(evidence.dueDate).toISOString().split('T')[0] : '');
    setEvidenceDialogOpen(true);
  };

  // Feature D: Open Notes Dialog
  const openNotesDialog = (indicatorId: string) => {
    const indicator = field.standards
      .flatMap((s) => s.indicators)
      .find((ind) => ind.id === indicatorId);
    setNotesIndicatorId(indicatorId);
    setNotesValue(indicator?.notes || '');
    setNotesDialogOpen(true);
  };

  // Feature D: Save Notes
  const handleSaveNotes = async () => {
    if (!notesIndicatorId) return;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/indicators/${notesIndicatorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesValue || null }),
      });
      if (res.ok) {
        toast.success('تم حفظ الملاحظات بنجاح');
        setNotesDialogOpen(false);
        await onRefresh();
      } else {
        toast.error('فشل حفظ الملاحظات');
      }
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceName.trim() || !selectedIndicatorId) return;

    setSubmitting(true);
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;

      if (evidenceFile) {
        const formData = new FormData();
        formData.append('file', evidenceFile);
        const uploadRes = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          filePath = uploadData.filePath;
          fileName = uploadData.fileName;
        } else {
          toast.error('فشل رفع الملف');
          setSubmitting(false);
          return;
        }
      }

      if (editingEvidence) {
        const res = await fetch(`/api/evidence/${editingEvidence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: evidenceName,
            description: evidenceDescription || null,
            link: evidenceLink || null,
            status: evidenceStatus,
            priority: evidencePriority,
            comments: evidenceComments || null,
            dueDate: evidenceDueDate || null,
            ...(filePath && { filePath, fileName }),
          }),
        });
        if (res.ok) {
          toast.success('تم تحديث الشاهد بنجاح');
        } else {
          toast.error('فشل تحديث الشاهد');
        }
      } else {
        const res = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: evidenceName,
            description: evidenceDescription || null,
            link: evidenceLink || null,
            fileName,
            filePath,
            status: evidenceStatus,
            priority: evidencePriority,
            comments: evidenceComments || null,
            dueDate: evidenceDueDate || null,
            indicatorId: selectedIndicatorId,
          }),
        });
        if (res.ok) {
          toast.success('تم إضافة الشاهد بنجاح');
        } else {
          toast.error('فشل إضافة الشاهد');
        }
      }

      setEvidenceDialogOpen(false);
      await onRefresh();
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvidence = async (id: string) => {
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الشاهد بنجاح');
        await onRefresh();
      } else {
        toast.error('فشل حذف الشاهد');
      }
    } catch (error) {
      console.error('Error deleting evidence:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
    setDeleteConfirm(null);
  };

  // Feature A: Bulk Delete Handler
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedEvidenceIds) {
        const res = await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
        if (res.ok) successCount++;
      }
      toast.success(`تم حذف ${successCount} شاهد بنجاح`);
      setSelectedEvidenceIds(new Set());
      setBulkDeleteConfirm(false);
      await onRefresh();
    } catch {
      toast.error('حدث خطأ أثناء الحذف الجماعي');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Feature A: Bulk Status Change Handler
  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedEvidenceIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      let successCount = 0;
      for (const id of selectedEvidenceIds) {
        const res = await fetch(`/api/evidence/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) successCount++;
      }
      toast.success(`تم تحديث حالة ${successCount} شاهد`);
      setSelectedEvidenceIds(new Set());
      setBulkStatusValue('');
      await onRefresh();
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Feature A: Toggle evidence selection
  const toggleEvidenceSelection = (id: string) => {
    setSelectedEvidenceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Feature A: Select/Deselect all evidence
  const toggleSelectAll = () => {
    if (selectedEvidenceIds.size === allFieldEvidence.length) {
      setSelectedEvidenceIds(new Set());
    } else {
      setSelectedEvidenceIds(new Set(allFieldEvidence.map((e) => e.id)));
    }
  };

  // Filter indicators by search and priority
  const filteredStandards = field.standards.map((std) => ({
    ...std,
    indicators: std.indicators
      .filter((ind) =>
        !indicatorSearch || ind.name.includes(indicatorSearch)
      )
      .map((ind) => ({
        ...ind,
        evidences: ind.evidences
          // Feature C: Priority filter
          .filter((ev) =>
            priorityFilter === 'all' || ev.priority === priorityFilter
          )
          // Feature C: Sort by priority (high first)
          .sort((a, b) => (prioritySortOrder[a.priority] ?? 1) - (prioritySortOrder[b.priority] ?? 1)),
      })),
  })).filter((std) => std.indicators.length > 0);

  // Check if any evidence is selected
  const hasSelectedEvidence = selectedEvidenceIds.size > 0;
  const allEvidenceSelected = allFieldEvidence.length > 0 && selectedEvidenceIds.size === allFieldEvidence.length;

  // Domain color mapping for print and CSS custom properties
  const domainColorMap: Record<string, { primary: string; light: string; dark: string }> = {
    '0': { primary: '#0ea5e9', light: '#e0f2fe', dark: '#0369a1' }, // sky - الإدارة المدرسية
    '1': { primary: '#14b8a6', light: '#ccfbf1', dark: '#0d9488' }, // teal - التعليم والتعلم
    '2': { primary: '#f59e0b', light: '#fef3c7', dark: '#b45309' }, // amber - نواتج التعلم
    '3': { primary: '#10b981', light: '#d1fae5', dark: '#047857' }, // emerald - البيئة المدرسية
  };
  const domainColorIdx = String((field.order - 1) % 4);
  const domainColorSet = domainColorMap[domainColorIdx] || domainColorMap['0'];

  // ============ Part A: Domain Print Report ============
  const handleDomainPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const domainColor = domainColorSet.primary;
    const domainColorLight = domainColorSet.light;
    const domainColorDark = domainColorSet.dark;

    // Standard-by-standard breakdown
    const standardRows = field.standards.map((s) => {
      const sIndicators = s.indicators;
      const sRequired = sIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
      const sUploaded = sIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
      const sCompleted = sIndicators.filter((ind) => ind.evidences.length >= ind.requiredEvidence).length;
      const sProgress = sRequired > 0 ? Math.round((sUploaded / sRequired) * 100) : 0;
      return `
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;font-weight:bold;">${s.name}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sIndicators.length}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sCompleted}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${sUploaded} / ${sRequired}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px;text-align:center;font-weight:bold;color:${sProgress === 100 ? '#10b981' : sProgress >= 50 ? '#f59e0b' : domainColor}">${sProgress}%</td>
        </tr>
      `;
    }).join('');

    // Indicator status table
    const indicatorRows = field.standards.flatMap((s) =>
      s.indicators.map((ind) => {
        const isComplete = ind.evidences.length >= ind.requiredEvidence;
        return `
          <tr>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;">${ind.name}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${s.name}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;">${ind.evidences.length} / ${ind.requiredEvidence}</td>
            <td style="padding:6px;border:1px solid #e2e8f0;font-size:11px;text-align:center;color:${isComplete ? '#10b981' : '#ef4444'};font-weight:bold;">${isComplete ? 'مكتمل ✓' : 'غير مكتمل'}</td>
          </tr>
        `;
      })
    ).join('');

    // Evidence status distribution
    const allEv = field.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences));
    const draftCount = allEv.filter((e) => e.status === 'draft').length;
    const submittedCount = allEv.filter((e) => e.status === 'submitted').length;
    const approvedCount = allEv.filter((e) => e.status === 'approved').length;

    // Auto-generated improvement recommendations
    const incompleteIndicators = field.standards.flatMap((s) =>
      s.indicators
        .filter((ind) => ind.evidences.length < ind.requiredEvidence)
        .map((ind) => ({
          name: ind.name,
          needsMore: ind.requiredEvidence - ind.evidences.length,
        }))
    );
    const incompleteStandards = field.standards
      .map((s) => {
        const sReq = s.indicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
        const sUp = s.indicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
        const sProg = sReq > 0 ? Math.round((sUp / sReq) * 100) : 0;
        return { name: s.name, progress: sProg };
      })
      .filter((s) => s.progress < 100);

    const recommendationItems = [
      ...incompleteIndicators.map((ind) => `<li style="margin-bottom:6px;font-size:12px;">المؤشر <strong>${ind.name}</strong> يحتاج <strong style="color:#ef4444">${ind.needsMore}</strong> شواهد إضافية</li>`),
      ...incompleteStandards.map((s) => `<li style="margin-bottom:6px;font-size:12px;">المعيار <strong>${s.name}</strong> مكتمل بنسبة <strong style="color:${s.progress >= 50 ? '#f59e0b' : '#ef4444'}">${s.progress}%</strong></li>`),
    ].join('');

    // Strengths (completed standards)
    const completedStandards = field.standards
      .map((s) => {
        const sReq = s.indicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
        const sUp = s.indicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
        const sProg = sReq > 0 ? Math.round((sUp / sReq) * 100) : 0;
        return { name: s.name, progress: sProg };
      })
      .filter((s) => s.progress === 100);

    const strengthItems = completedStandards.length > 0
      ? completedStandards.map((s) => `<li style="margin-bottom:6px;font-size:12px;"><strong style="color:#10b981">✓</strong> ${s.name} <span style="color:#10b981;font-weight:bold;">(مكتمل 100%)</span></li>`).join('')
      : '<li style="font-size:12px;color:#94a3b8;">لا توجد معايير مكتملة حتى الآن</li>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير مجال ${field.name} - مدارس قرطبة</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 30px; color: #1e293b; line-height: 1.6; }
          h1 { color: ${domainColorDark}; border-bottom: 3px solid ${domainColor}; padding-bottom: 10px; }
          h2 { color: ${domainColorDark}; margin-top: 30px; border-bottom: 1px solid ${domainColorLight}; padding-bottom: 6px; }
          h3 { color: ${domainColor}; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: ${domainColorLight}; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: ${domainColorDark}; }
          .header { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
          .header img { height: 60px; }
          .domain-banner { background: linear-gradient(135deg, ${domainColorLight}, #fff); border: 2px solid ${domainColor}; border-radius: 12px; padding: 20px; margin: 20px 0; display: flex; align-items: center; gap: 20px; }
          .domain-progress-ring { width: 90px; height: 90px; border-radius: 50%; border: 6px solid ${domainColorLight}; border-top-color: ${domainColor}; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; color: ${domainColorDark}; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-box { background: ${domainColorLight}; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid ${domainColor}33; }
          .stat-box .value { font-size: 28px; font-weight: bold; color: ${domainColorDark}; }
          .stat-box .label { font-size: 12px; color: #64748b; }
          .evidence-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
          .evidence-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }
          .evidence-item .count { font-size: 22px; font-weight: bold; }
          .evidence-item .lbl { font-size: 11px; color: #64748b; }
          .recommendations { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .recommendations h3 { color: #991b1b; }
          .strengths { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .strengths h3 { color: #166534; }
          .signature-section { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
          .signature-line { display: inline-block; width: 200px; border-bottom: 1px solid #1e293b; margin-top: 40px; }
          footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @page { margin: 1.5cm; }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="شعار مدارس قرطبة" onerror="this.style.display='none'" />
          <div>
            <h1 style="margin:0;border:none;padding:0;">تقرير مجال: ${field.name}</h1>
            <p style="color:#64748b;margin:5px 0;">مدارس قرطبة الأهلية – مجمع أبحر</p>
            <p style="color:${domainColor};font-size:12px;">معايير هيئة تقويم التعليم 2026 | تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <div class="domain-banner">
          <div class="domain-progress-ring">${field.progress}%</div>
          <div>
            <h2 style="margin:0;border:none;padding:0;">${field.name}</h2>
            <p style="color:#64748b;font-size:13px;">${field.description || ''}</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box"><div class="value">${field.standardsCount}</div><div class="label">المعايير</div></div>
          <div class="stat-box"><div class="value">${field.indicatorsCount}</div><div class="label">المؤشرات</div></div>
          <div class="stat-box"><div class="value">${field.completedIndicators}</div><div class="label">مكتملة</div></div>
          <div class="stat-box"><div class="value">${field.totalUploaded} / ${field.totalRequired}</div><div class="label">الشواهد</div></div>
        </div>

        <h2>تفاصيل المعايير</h2>
        <table>
          <thead>
            <tr>
              <th>المعيار</th>
              <th>المؤشرات</th>
              <th>مكتملة</th>
              <th>الشواهد</th>
              <th>النسبة</th>
            </tr>
          </thead>
          <tbody>${standardRows}</tbody>
        </table>

        <h2>حالة المؤشرات</h2>
        <table>
          <thead>
            <tr>
              <th>المؤشر</th>
              <th>المعيار</th>
              <th>الشواهد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>${indicatorRows}</tbody>
        </table>

        <h2>توزيع حالات الشواهد</h2>
        <div class="evidence-summary">
          <div class="evidence-item"><div class="count" style="color:#94a3b8">${draftCount}</div><div class="lbl">مسودة</div></div>
          <div class="evidence-item"><div class="count" style="color:#f59e0b">${submittedCount}</div><div class="lbl">مقدّم</div></div>
          <div class="evidence-item"><div class="count" style="color:#10b981">${approvedCount}</div><div class="lbl">معتمد</div></div>
        </div>

        <div class="recommendations">
          <h3>🔄 توصيات التحسين</h3>
          <ul style="padding-right:20px;margin:10px 0;">${recommendationItems || '<li style="font-size:12px;color:#10b981;">جميع المؤشرات مكتملة - ممتاز!</li>'}</ul>
        </div>

        <div class="strengths">
          <h3>✅ نقاط القوة</h3>
          <ul style="padding-right:20px;margin:10px 0;">${strengthItems}</ul>
        </div>

        <div class="signature-section">
          <div style="display:flex;justify-content:space-between;">
            <div>
              <p style="font-size:12px;color:#64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <div>
              <span style="font-size:12px;color:#64748b;">التوقيع: </span>
              <span class="signature-line"></span>
            </div>
          </div>
        </div>

        <footer>
          مدارس قرطبة الأهلية – مجمع أبحر | تقرير تقويم التعليم 2026 | ${field.name}
        </footer>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 domain-themed domain-gradient-bg"
      style={{
        '--domain-color': domainColorSet.primary,
        '--domain-color-light': domainColorSet.light,
        '--domain-color-dark': domainColorSet.dark,
      } as React.CSSProperties}
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 animate-fade-in flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-sky-600 dark:text-sky-400 btn-press">
          <ChevronRight className="h-4 w-4" />
          الرئيسية
        </Button>
        <ChevronLeft className="h-3.5 w-3.5 text-sky-400 dark:text-sky-500" />
        <span className="text-sm font-medium text-sky-800 dark:text-sky-200">{field.name}</span>
        {/* Domain Report Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 mr-auto border-sky-200 dark:border-slate-700 btn-press"
                onClick={handleDomainPrint}
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">تقرير المجال</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" dir="rtl">
              طباعة تقرير تفصيلي لهذا المجال
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Domain Quick Switch Dropdown */}
        {onNavigateToField && fields.length > 1 && (
          <div>
            <Select
              value={field.id}
              onValueChange={(val) => {
                if (val !== field.id) onNavigateToField(val);
              }}
            >
              <SelectTrigger className="h-7 text-xs w-auto min-w-[140px] max-w-[200px] border-sky-200 dark:border-slate-700 dark:bg-slate-800">
                <SelectValue placeholder="انتقل لمجال" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f, fIdx) => {
                  const fColor = domainBarColors[fIdx % 4];
                  return (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fColor }} />
                        <span className="truncate">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground">({f.progress}%)</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Field Header - Hero Banner */}
      <Card className="mb-8 border-sky-200 dark:border-slate-700 overflow-hidden animate-slide-up shadow-lg relative domain-card-border">
        <div className={`h-3 bg-gradient-to-l ${domainColors.from} ${domainColors.to} relative overflow-hidden domain-accent-bar`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(255,255,255,0.3) 12px, rgba(255,255,255,0.3) 14px)' }} />
        </div>
        <CardHeader className={`bg-gradient-to-l ${domainColors.bg}/50 to-white dark:to-slate-900`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${domainColors.iconBg} ${domainColors.iconText} domain-icon-glow`}>
              <IconComponent className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-2xl ${domainColors.text}`}>{field.name}</CardTitle>
              <CardDescription className={`${domainColors.text} mt-1`}>{field.description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Circular Progress - animated on mount */}
              <div className="relative">
                <CircularProgress value={field.progress} size={72} strokeWidth={5} className="animate-ring" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${domainColors.text}`}>{field.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`pt-0 bg-gradient-to-l ${domainColors.bg}/30 to-white dark:to-slate-900 relative`}>
          <Progress value={field.progress} className={`h-3 mb-3 domain-card-progress progress-color-${['sky', 'teal', 'amber', 'emerald'][(field.order - 1) % 4]} progress-animated ${field.progress === 100 ? 'progress-complete' : ''} progress-bounce`} />
          <div className={`flex flex-wrap items-center gap-4 text-sm ${domainColors.text}`}>
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-3 py-1 rounded-lg">
              <BarChart3 className={`h-4 w-4 ${domainColors.iconText}`} />
              <span>{field.standardsCount} معايير</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-3 py-1 rounded-lg">
              <Eye className={`h-4 w-4 ${domainColors.iconText}`} />
              <span>{field.indicatorsCount} مؤشرات</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-slate-800/70 px-3 py-1 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{field.completedIndicators} مؤشرات مكتملة</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 px-3 py-1 rounded-lg">
              <Upload className={`h-4 w-4 ${domainColors.iconText}`} />
              <span>{field.totalUploaded} / {field.totalRequired} شاهد</span>
            </div>
          </div>
          {/* Wave decorative SVG at bottom */}
          <div className="wave-decoration">
            <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ width: '100%', height: '20px' }}>
              <path d="M0,20 C150,40 350,0 500,20 C650,40 850,0 1000,20 C1100,30 1150,25 1200,20 L1200,40 L0,40 Z" fill="currentColor" className="text-sky-100/30 dark:text-slate-800/30" />
              <path d="M0,25 C200,10 400,35 600,25 C800,15 1000,35 1200,25 L1200,40 L0,40 Z" fill="currentColor" className="text-sky-100/20 dark:text-slate-800/20" />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Statistics Panel - Enhanced */}
      {(() => {
        const allEvidence = field.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences));
        const totalEv = allEvidence.length;
        const draftCount = allEvidence.filter((e) => e.status === 'draft').length;
        const submittedCount = allEvidence.filter((e) => e.status === 'submitted').length;
        const approvedCount = allEvidence.filter((e) => e.status === 'approved').length;
        const completionPct = field.totalRequired > 0 ? Math.round((field.totalUploaded / field.totalRequired) * 100) : 0;
        const statCards = [
          { icon: <ClipboardList className="h-4 w-4" />, value: totalEv, label: 'إجمالي الشواهد', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800' },
          { icon: <FileText className="h-4 w-4" />, value: draftCount, label: 'مسودة', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700' },
          { icon: <Clock className="h-4 w-4" />, value: submittedCount, label: 'مقدّم', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
          { icon: <CheckCircle2 className="h-4 w-4" />, value: approvedCount, label: 'معتمد', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
          { icon: <TrendingUp className="h-4 w-4" />, value: completionPct, label: 'نسبة الإنجاز', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', suffix: '%' },
        ];
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 animate-slide-up">
              {statCards.map((card, i) => (
                <Card key={i} className={`border ${card.border} p-3 text-center card-lift stats-card-enhanced ${i === 0 ? '' : i === 1 ? '' : i === 2 ? 'accent-amber' : i === 3 ? '' : 'accent-emerald'}`}>
                  <div className={`p-1.5 rounded-lg ${card.bg} w-fit mx-auto mb-2`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <p className={`text-xl font-bold ${card.color} stat-value-pop`}>{card.value}{card.suffix || ''}</p>
                  <p className="text-[10px] text-sky-500 dark:text-sky-400">{card.label}</p>
                </Card>
              ))}
            </div>

            {/* Enhanced Stats: Status Distribution + Standard Completion + Quick Add */}
            <Card className="mb-6 border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-sky-900 dark:text-sky-100 heading-decorated">إحصائيات تفصيلية</CardTitle>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const firstIndicator = field.standards[0]?.indicators[0];
                      if (firstIndicator) openAddEvidence(firstIndicator.id);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة شاهد سريع
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div>
                    <p className="text-sm font-medium text-sky-800 dark:text-sky-200 mb-3 heading-decorated">توزيع حالات الشواهد</p>
                    <div className="space-y-3">
                      {[
                        { key: 'draft', label: 'مسودة', count: draftCount, color: 'bg-slate-400', bgLight: 'bg-slate-100 dark:bg-slate-800' },
                        { key: 'submitted', label: 'مقدّم', count: submittedCount, color: 'bg-amber-400', bgLight: 'bg-amber-100 dark:bg-amber-900/30' },
                        { key: 'approved', label: 'معتمد', count: approvedCount, color: 'bg-emerald-400', bgLight: 'bg-emerald-100 dark:bg-emerald-900/30' },
                      ].map((s) => (
                        <div key={s.key} className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusBadgeClasses[s.key] || ''} ${s.bgLight}`}>
                            {s.label}
                          </span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.color} transition-all duration-500`}
                              style={{ width: totalEv > 0 ? `${(s.count / totalEv) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs font-medium text-sky-700 dark:text-sky-300 min-w-[28px] text-left">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Standard Completion Mini Progress */}
                  <div>
                    <p className="text-sm font-medium text-sky-800 dark:text-sky-200 mb-3 heading-decorated">تقدم المعايير</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {field.standards.map((s) => {
                        const sReq = s.indicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
                        const sUp = s.indicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
                        const sProg = sReq > 0 ? Math.round((sUp / sReq) * 100) : 0;
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="text-[11px] text-sky-700 dark:text-sky-300 truncate min-w-0 flex-1" title={s.name}>
                              {s.name}
                            </span>
                            <div className="w-20 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${sProg === 100 ? 'bg-emerald-400' : sProg >= 50 ? 'bg-amber-400' : 'bg-sky-400'}`}
                                style={{ width: `${sProg}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-medium min-w-[32px] text-left ${sProg === 100 ? 'text-emerald-600 dark:text-emerald-400' : sProg >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`}>
                              {sProg}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        );
      })()}

      {/* Indicator Search/Filter + Priority Filter (Feature C) + Bulk Select (Feature A) */}
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1 min-w-[200px]">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
            <Input
              value={indicatorSearch}
              onChange={(e) => setIndicatorSearch(e.target.value)}
              placeholder="ابحث في المؤشرات..."
              className="pr-9 dark:bg-slate-800 dark:border-slate-700 search-glow"
            />
            {indicatorSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setIndicatorSearch('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Feature C: Priority Filter Dropdown */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] border-sky-200 dark:border-slate-700 dark:bg-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-sky-500" />
                <SelectValue placeholder="الأولوية" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأولويات</SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  مرتفع
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  متوسط
                </div>
              </SelectItem>
              <SelectItem value="low">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  منخفض
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Feature A: Select All / Deselect All */}
          {allFieldEvidence.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 border-sky-200 dark:border-slate-700"
              onClick={toggleSelectAll}
            >
              {allEvidenceSelected ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  إلغاء التحديد
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  تحديد الكل
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Standards Accordion */}
      <div className="space-y-4">
        {filteredStandards.map((standard, sIdx) => {
          const sIndicators = standard.indicators;
          const sRequired = sIndicators.reduce((sum, ind) => sum + ind.requiredEvidence, 0);
          const sUploaded = sIndicators.reduce((sum, ind) => sum + ind.evidences.length, 0);
          const sProgress = sRequired > 0 ? Math.round((sUploaded / sRequired) * 100) : 0;
          const isExpanded = expandedStandard === standard.id;
          const progressBg = sProgress === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : sProgress >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';

          return (
            <Card key={standard.id} className={`border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in stagger-${Math.min(sIdx + 1, 8)} transition-all duration-300 ${isExpanded ? 'shadow-md' : ''} standard-accent standard-accent-${['sky', 'teal', 'amber', 'emerald'][sIdx % 4]} ${isExpanded ? 'expanded' : ''}`}>
              <CardHeader
                className="cursor-pointer hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 pb-3"
                onClick={() => setExpandedStandard(isExpanded ? null : standard.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${progressBg} transition-colors duration-300`}>
                      {sProgress === 100 ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <BarChart3 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base text-sky-900 dark:text-sky-100 heading-decorated">{standard.name}</CardTitle>
                        <span className={`status-badge ${sProgress === 100 ? 'completion-badge-gold' : sProgress >= 50 ? 'completion-badge-silver' : 'completion-badge-bronze'} text-[9px] px-1.5 py-0.5 rounded-full`}>{sUploaded}/{sRequired}</span>
                      </div>
                      <CardDescription className="text-xs text-sky-500 dark:text-sky-400">
                        {sUploaded} / {sRequired} شاهد • {sIndicators.length} مؤشرات
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Visual indicator count */}
                    <div className="hidden sm:flex items-center gap-0.5">
                      {sIndicators.map((ind, iIdx) => (
                        <div
                          key={iIdx}
                          className={`h-2.5 w-2.5 rounded-full transition-colors ${
                            ind.evidences.length >= ind.requiredEvidence ? 'bg-emerald-400' : 'bg-sky-200 dark:bg-slate-600'
                          }`}
                          title={ind.name}
                        />
                      ))}
                    </div>
                    <Badge variant={sProgress === 100 ? 'default' : 'secondary'} className={`${sProgress === 100 ? 'bg-emerald-600' : sProgress >= 50 ? 'bg-amber-500' : ''} transition-colors duration-300`}>
                      {sProgress}%
                    </Badge>
                    <ChevronLeft className={`h-5 w-5 text-sky-400 transition-transform duration-300 ${isExpanded ? '-rotate-90' : ''}`} />
                  </div>
                </div>
                <Progress value={sProgress} className="h-1.5 mt-3" />
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 border-t border-sky-100 dark:border-slate-700 animate-fade-in">
                  <div className="space-y-4 mt-4">
                    {sIndicators.map((indicator) => {
                      const isComplete = indicator.evidences.length >= indicator.requiredEvidence;
                      const indProgress = indicator.requiredEvidence > 0
                        ? Math.min(100, Math.round((indicator.evidences.length / indicator.requiredEvidence) * 100))
                        : 0;

                      return (
                        <div
                          key={indicator.id}
                          className={`p-4 rounded-xl border indicator-stagger ${
                            isComplete
                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                              : 'border-sky-200 bg-sky-50/30 dark:border-slate-700 dark:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-2 flex-1">
                              {isComplete ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-sky-400 mt-0.5 shrink-0" />
                              )}
                              <p className="text-sm font-medium text-sky-900 dark:text-sky-100 leading-relaxed">
                                {indicator.name}
                              </p>
                              {/* Feature D: Notes badge on indicator */}
                              {indicator.notes && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 cursor-help">
                                        <StickyNote className="h-2.5 w-2.5" />
                                        ملاحظات
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs" dir="rtl">
                                      {indicator.notes}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Feature D: Notes button */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs h-8 w-8 p-0"
                                      onClick={() => openNotesDialog(indicator.id)}
                                    >
                                      <StickyNote className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" dir="rtl">
                                    {indicator.notes ? 'تعديل الملاحظات' : 'إضافة ملاحظات'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 gap-1 text-xs"
                                onClick={() => openAddEvidence(indicator.id)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                إضافة شاهد
                              </Button>
                            </div>
                          </div>

                          {/* Feature D: Show indicator notes if present */}
                          {indicator.notes && (
                            <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                              <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{indicator.notes}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-3">
                            <Progress value={indProgress} className="h-2 flex-1" />
                            <span className={`text-xs font-bold ${
                              isComplete ? 'text-emerald-600' : 'text-sky-600'
                            }`}>
                              {indicator.evidences.length} / {indicator.requiredEvidence}
                            </span>
                          </div>

                          {/* Evidence List */}
                          {indicator.evidences.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {indicator.evidences.map((ev) => (
                                <div
                                  key={ev.id}
                                  className={`evidence-card evidence-card-enhanced evidence-status-${ev.status || 'draft'} evidence-status-change flex items-center gap-2 p-2.5 rounded-xl border border-sky-100 dark:border-slate-700 text-sm ${selectedEvidenceIds.has(ev.id) ? 'ring-2 ring-sky-400 dark:ring-sky-500 bg-sky-50 dark:bg-slate-750' : ''}`}
                                >
                                  {/* Feature A: Checkbox for bulk selection */}
                                  <Checkbox
                                    checked={selectedEvidenceIds.has(ev.id)}
                                    onCheckedChange={() => toggleEvidenceSelection(ev.id)}
                                    className="shrink-0"
                                    aria-label={`تحديد ${ev.name}`}
                                  />

                                  {/* Feature C: Priority dot indicator */}
                                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDotColors[ev.priority] || 'bg-slate-400'}`} title={priorityLabels[ev.priority]} />

                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {ev.filePath ? (
                                      <div className="evidence-type-icon bg-red-50 dark:bg-red-900/20">
                                        <FileText className="h-4 w-4 text-red-500 shrink-0" />
                                      </div>
                                    ) : ev.link ? (
                                      <div className="evidence-type-icon bg-teal-50 dark:bg-teal-900/20">
                                        <Link2 className="h-4 w-4 text-teal-500 shrink-0" />
                                      </div>
                                    ) : (
                                      <div className="evidence-type-icon bg-sky-50 dark:bg-sky-900/20">
                                        <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`truncate text-sky-800 dark:text-sky-200 ${ev.priority === 'high' ? 'font-bold' : ''}`}>{ev.name}</span>
                                        <span className={`${statusBadgeClasses[ev.status] || statusBadgeClasses.draft} shrink-0`}>
                                          {statusLabels[ev.status] || statusLabels.draft}
                                        </span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${priorityColors[ev.priority] || priorityColors.medium}`}>
                                          {priorityLabels[ev.priority] || priorityLabels.medium}
                                        </span>
                                        {ev.dueDate && (() => {
                                          const dueDate = new Date(ev.dueDate);
                                          const now = new Date();
                                          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                          const isOverdue = daysUntilDue < 0;
                                          const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
                                          if (isOverdue) {
                                            return (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 shrink-0 animate-pulse">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                متأخر
                                              </span>
                                            );
                                          }
                                          if (isDueSoon) {
                                            return (
                                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                                                <Clock className="h-2.5 w-2.5" />
                                                {daysUntilDue === 0 ? 'اليوم' : `باقي ${daysUntilDue} يوم`}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                        {ev.comments && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 shrink-0 cursor-help">
                                                  <MessageSquare className="h-2.5 w-2.5" />
                                                  <CommentCountBadge comments={ev.comments} />
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs text-xs" dir="rtl">
                                                {ev.comments}
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                      {ev.description && (
                                        <p className="text-[11px] text-sky-500 dark:text-sky-400 mt-0.5 truncate">{ev.description}</p>
                                      )}
                                      <span className="text-[10px] text-sky-400">
                                        {new Date(ev.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {ev.link && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                        <a href={ev.link} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                      </Button>
                                    )}
                                    {ev.filePath && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setPdfViewerFile({ name: ev.fileName || ev.name, url: ev.filePath || '' }); setPdfViewerOpen(true); }}>
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-sky-600 hover:text-sky-800"
                                      onClick={() => openEditEvidence(ev)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-700"
                                      onClick={() => setDeleteConfirm(ev.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
        {filteredStandards.length === 0 && indicatorSearch && (
          <div className="text-center py-12 text-sky-400 dark:text-sky-500">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد مؤشرات مطابقة لـ &quot;{indicatorSearch}&quot;</p>
          </div>
        )}
      </div>

      {/* Feature A: Floating Bulk Action Toolbar */}
      {hasSelectedEvidence && (
        <div className="fixed bottom-14 left-4 right-4 sm:left-auto sm:right-8 sm:w-auto z-50 animate-slide-up">
          <div className="bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl shadow-xl p-3 flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <Badge variant="secondary" className="gap-1.5 text-xs shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              <CheckSquare className="h-3 w-3" />
              {selectedEvidenceIds.size} محدد
            </Badge>
            <div className="h-6 w-px bg-sky-200 dark:bg-slate-700 hidden sm:block" />
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              onClick={() => setBulkDeleteConfirm(true)}
              disabled={bulkActionLoading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف المحدد
            </Button>
            <Select value={bulkStatusValue} onValueChange={(val) => { setBulkStatusValue(val); handleBulkStatusChange(val); }}>
              <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs border-sky-200 dark:border-slate-700">
                <SelectValue placeholder="تغيير الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="submitted">مقدّم</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs shrink-0"
              onClick={() => setSelectedEvidenceIds(new Set())}
            >
              <X className="h-3.5 w-3.5" />
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Feature A: Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الحذف الجماعي
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedEvidenceIds.size} شاهد محدد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حذف {selectedEvidenceIds.size} شاهد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingEvidence ? 'تعديل الشاهد' : 'إضافة شاهد جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingEvidence
                ? 'قم بتعديل بيانات الشاهد'
                : 'أدخل بيانات الشاهد الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidence-name">اسم الشاهد *</Label>
              <Input
                id="evidence-name"
                value={evidenceName}
                onChange={(e) => setEvidenceName(e.target.value)}
                placeholder="أدخل اسم الشاهد"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-description">وصف / ملاحظات</Label>
              <Textarea
                id="evidence-description"
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                placeholder="أضف وصفاً أو ملاحظات حول الشاهد..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-link">الرابط (اختياري)</Label>
              <Input
                id="evidence-link"
                value={evidenceLink}
                onChange={(e) => setEvidenceLink(e.target.value)}
                placeholder="https://example.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-file">ملف PDF (اختياري)</Label>
              <Input
                id="evidence-file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
              />
              {evidenceFile && (
                <p className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {evidenceFile.name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>حالة الشاهد</Label>
                <Select value={evidenceStatus} onValueChange={setEvidenceStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">مقدّم</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الأهمية</Label>
                <Select value={evidencePriority} onValueChange={setEvidencePriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        مرتفع
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        متوسط
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        منخفض
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-due-date">تاريخ الاستحقاق</Label>
              <Input
                id="evidence-due-date"
                type="date"
                value={evidenceDueDate}
                onChange={(e) => setEvidenceDueDate(e.target.value)}
                className="dark:bg-slate-800 dark:border-slate-700"
              />
              {evidenceDueDate && new Date(evidenceDueDate) < new Date() && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  هذا التاريخ قد مر بالفعل
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-comments">ملاحظات / تعليقات</Label>
              <CommentsSection
                comments={evidenceComments}
                onCommentsChange={setEvidenceComments}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmitEvidence}
              disabled={!evidenceName.trim() || submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingEvidence ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الشاهد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteEvidence(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feature D: Indicator Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              ملاحظات المؤشر
            </DialogTitle>
            <DialogDescription>
              أضف أو عدّل ملاحظات حول هذا المؤشر
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              rows={5}
              className="resize-none dark:bg-slate-800 dark:border-slate-700"
              dir="rtl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="gap-2"
            >
              {notesSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StickyNote className="h-4 w-4" />
              )}
              حفظ الملاحظات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh]" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                {pdfViewerFile?.name || 'عرض الملف'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {pdfViewerFile?.url && (
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={pdfViewerFile.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" />
                      تحميل
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-2 border rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900" style={{ height: '70vh' }}>
            {pdfViewerFile?.url ? (
              <iframe
                src={pdfViewerFile.url}
                className="w-full h-full border-0"
                title={pdfViewerFile.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <FileText className="h-16 w-16" />
                <p>لا يمكن عرض الملف</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Quick Add Evidence Button */}
      <button
        className="domain-quick-add"
        onClick={() => {
          const firstStandard = field.standards[0];
          const firstIndicator = firstStandard?.indicators[0];
          if (firstIndicator) openAddEvidence(firstIndicator.id);
        }}
        title="إضافة شاهد سريع"
        aria-label="إضافة شاهد سريع"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Quick Stats Footer - Sticky Bottom Bar */}
      {(() => {
        const allDomainEvidence = field.standards.flatMap((s) => s.indicators.flatMap((ind) => ind.evidences));
        const totalEv = allDomainEvidence.length;
        const approvedEv = allDomainEvidence.filter((e) => e.status === 'approved').length;
        const draftEv = allDomainEvidence.filter((e) => e.status === 'draft').length;
        const completionPct = field.totalRequired > 0 ? Math.round((field.totalUploaded / field.totalRequired) * 100) : 0;
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-t border-sky-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span className="font-bold">{totalEv}</span>
                    <span className="text-sky-500 dark:text-sky-400">شاهد</span>
                  </div>
                  <div className="h-4 w-px bg-sky-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{approvedEv}</span>
                    <span className="text-sky-500 dark:text-sky-400">معتمد</span>
                  </div>
                  <div className="h-4 w-px bg-sky-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">{draftEv}</span>
                    <span className="text-sky-500 dark:text-sky-400">مسودة</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={completionPct} className="h-2 w-20" />
                  <span className="font-bold text-sky-700 dark:text-sky-300">{completionPct}%</span>
                  <span className="text-sky-500 dark:text-sky-400">إنجاز</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
