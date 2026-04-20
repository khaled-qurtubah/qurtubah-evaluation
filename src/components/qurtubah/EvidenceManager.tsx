'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Link2, Search, Download, Loader2, Trash2, ExternalLink, CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { statusLabels, statusBadgeClasses, priorityLabels, priorityColors } from './constants';
import type { FieldWithDetails } from './types';

// ============ Evidence Manager ============
export function EvidenceManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
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
