'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bookmark, BookmarkCheck, Plus, Trash2, Copy, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// ============ Template Types ============
export interface EvidenceTemplate {
  id: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

const STORAGE_KEY = 'qurtubah_templates';

function loadTemplates(): EvidenceTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: EvidenceTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

// ============ Template Hook ============
export function useTemplates() {
  const [templates, setTemplates] = useState<EvidenceTemplate[]>(loadTemplates);

  const refreshTemplates = useCallback(() => {
    setTemplates(loadTemplates());
  }, []);

  const addTemplate = useCallback((template: Omit<EvidenceTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: EvidenceTemplate = {
      ...template,
      id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    toast.success('تم حفظ القالب بنجاح');
    return newTemplate;
  }, [templates]);

  const deleteTemplate = useCallback((id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
    toast.success('تم حذف القالب');
  }, [templates]);

  return { templates, refreshTemplates, addTemplate, deleteTemplate };
}

// ============ Save as Template Button ============
export function SaveTemplateButton({
  name,
  description,
  priority,
  status,
  onSaved,
}: {
  name: string;
  description: string;
  priority: string;
  status: string;
  onSaved?: () => void;
}) {
  const { addTemplate } = useTemplates();

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('يجب إدخال اسم الشاهد أولاً');
      return;
    }
    addTemplate({ name, description, priority, status });
    onSaved?.();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            onClick={handleSave}
          >
            <Bookmark className="h-3.5 w-3.5" />
            حفظ كقالب
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" dir="rtl" className="text-xs">
          حفظ بيانات الشاهد كقالب لإعادة استخدامه
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ Use Template Dropdown ============
export function UseTemplateButton({
  onApply,
}: {
  onApply: (template: EvidenceTemplate) => void;
}) {
  const { templates } = useTemplates();
  const [open, setOpen] = useState(false);

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
        onClick={() => setOpen(!open)}
      >
        <BookmarkCheck className="h-3.5 w-3.5" />
        استخدام قالب
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-sky-200 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="p-2 border-b border-sky-100 dark:border-slate-700">
              <span className="text-xs font-medium text-sky-700 dark:text-sky-300">القوالب المحفوظة</span>
            </div>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                className="w-full text-right p-2.5 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors border-b border-sky-50 dark:border-slate-700/50 last:border-0"
                onClick={() => {
                  onApply(tpl);
                  setOpen(false);
                }}
              >
                <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">{tpl.name}</p>
                {tpl.description && (
                  <p className="text-[10px] text-sky-500 dark:text-sky-400 truncate mt-0.5">{tpl.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    tpl.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    tpl.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {tpl.priority === 'high' ? 'مرتفع' : tpl.priority === 'medium' ? 'متوسط' : 'منخفض'}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    tpl.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    tpl.status === 'submitted' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {tpl.status === 'approved' ? 'معتمد' : tpl.status === 'submitted' ? 'مقدّم' : 'مسودة'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Template Manager (Dashboard Tab Content) ============
export function TemplateManager() {
  const { templates, addTemplate, deleteTemplate } = useTemplates();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStatus, setNewStatus] = useState('draft');

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error('يجب إدخال اسم القالب');
      return;
    }
    addTemplate({ name: newName, description: newDesc, priority: newPriority, status: newStatus });
    setAddDialogOpen(false);
    setNewName('');
    setNewDesc('');
    setNewPriority('medium');
    setNewStatus('draft');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-amber-500" />
          إدارة القوالب
        </h3>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          قالب جديد
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-sky-200 dark:border-slate-700 p-8 text-center">
          <Bookmark className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sky-600 dark:text-sky-400 text-sm">لا توجد قوالب محفوظة</p>
          <p className="text-xs text-sky-400 dark:text-sky-500 mt-1">احفظ شاهد كقالب لإعادة استخدامه لاحقاً</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="border-sky-200 dark:border-slate-700 p-4 card-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">{tpl.name}</p>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-sky-500 dark:text-sky-400 mt-1 truncate">{tpl.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      tpl.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      tpl.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {tpl.priority === 'high' ? 'مرتفع' : tpl.priority === 'medium' ? 'متوسط' : 'منخفض'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      tpl.status === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      tpl.status === 'submitted' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {tpl.status === 'approved' ? 'معتمد' : tpl.status === 'submitted' ? 'مقدّم' : 'مسودة'}
                    </span>
                    <span className="text-[10px] text-sky-400 dark:text-sky-500">
                      {new Date(tpl.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                  onClick={() => setDeleteConfirmId(tpl.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Template Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              قالب جديد
            </DialogTitle>
            <DialogDescription>أنشئ قالباً جديداً لتسهيل إضافة الشواهد</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم القالب *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="أدخل اسم القالب" />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="وصف القالب..." rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الأولوية</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">مرتفع</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">مقدّم</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا القالب؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deleteConfirmId) deleteTemplate(deleteConfirmId); setDeleteConfirmId(null); }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
