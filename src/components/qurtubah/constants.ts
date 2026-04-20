import React, {
  Building2,
  GraduationCap,
  Trophy,
  School,
} from 'lucide-react';

// ============ Icon Mapping ============
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  GraduationCap,
  Trophy,
  School,
};

// ============ Domain Color Helpers ============
export const domainBarColors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#10b981'];
export const domainBarBgColors = ['#e0f2fe', '#ccfbf1', '#fef3c7', '#d1fae5'];

// ============ Evidence Status Helpers ============
export const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدّم',
  approved: 'معتمد',
};

export const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// Status badge class map (enhanced animated badges)
export const statusBadgeClasses: Record<string, string> = {
  draft: 'status-badge status-badge-draft',
  submitted: 'status-badge status-badge-submitted',
  approved: 'status-badge status-badge-approved',
};

// Evidence priority class map based on status
export const evidencePriorityClasses: Record<string, string> = {
  draft: 'evidence-priority-low',
  submitted: 'evidence-priority-medium',
  approved: 'evidence-priority-high',
};

// ============ Evidence Priority Helpers ============
export const priorityLabels: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
};

export const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ============ Domain Color Mapping ============
export const domainGradients: Record<string, { from: string; to: string; bg: string; text: string; iconBg: string; iconText: string; headerFrom: string; headerTo: string }> = {
  '0': { from: 'from-sky-400', to: 'to-sky-600', bg: 'bg-sky-50', text: 'text-sky-700', iconBg: 'bg-sky-100', iconText: 'text-sky-700', headerFrom: 'from-sky-400', headerTo: 'to-sky-700' },
  '1': { from: 'from-teal-400', to: 'to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', iconText: 'text-teal-700', headerFrom: 'from-teal-400', headerTo: 'to-teal-700' },
  '2': { from: 'from-amber-400', to: 'to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-700', headerFrom: 'from-amber-400', headerTo: 'to-amber-700' },
  '3': { from: 'from-emerald-400', to: 'to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', headerFrom: 'from-emerald-400', headerTo: 'to-emerald-700' },
};
