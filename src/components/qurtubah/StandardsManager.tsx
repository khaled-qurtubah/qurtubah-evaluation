'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { FieldWithDetails } from './types';

// ============ Standards Manager ============
export function StandardsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
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
