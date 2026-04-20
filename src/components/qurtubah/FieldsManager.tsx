'use client';

import React, { useState } from 'react';
import {
  Building2, Plus, Pencil, Trash2, Loader2,
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { iconMap } from './constants';
import type { FieldWithDetails } from './types';

// ============ Fields Manager ============
export function FieldsManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
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
