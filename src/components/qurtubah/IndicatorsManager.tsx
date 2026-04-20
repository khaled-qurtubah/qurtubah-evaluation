'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { FieldWithDetails } from './types';

// ============ Indicators Manager ============
export function IndicatorsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
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
