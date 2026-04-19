'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, GraduationCap, Trophy, School, ChevronLeft, ChevronRight,
  Plus, Pencil, Trash2, FileText, Link2, Upload, LogIn, LogOut,
  LayoutDashboard, Home, BarChart3, CheckCircle2, Circle, AlertCircle,
  Search, Eye, Download, Loader2, Shield, X, Menu, ExternalLink,
  Moon, Sun, Printer, FileJson, Clock, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

// ============ Types ============
interface Evidence {
  id: string;
  name: string;
  link: string | null;
  fileName: string | null;
  filePath: string | null;
  indicatorId: string;
  createdAt: string;
  updatedAt: string;
  indicator?: Indicator;
}

interface Indicator {
  id: string;
  name: string;
  description: string | null;
  order: number;
  requiredEvidence: number;
  standardId: string;
  evidences: Evidence[];
}

interface Standard {
  id: string;
  name: string;
  description: string | null;
  order: number;
  fieldId: string;
  indicators: Indicator[];
}

interface FieldWithDetails {
  id: string;
  name: string;
  description: string | null;
  order: number;
  icon: string | null;
  standards: Standard[];
  standardsCount: number;
  indicatorsCount: number;
  totalRequired: number;
  totalUploaded: number;
  completedIndicators: number;
  progress: number;
}

interface ProgressData {
  totalFields: number;
  totalIndicators: number;
  completedIndicators: number;
  totalRequired: number;
  totalUploaded: number;
  progress: number;
  fields: {
    id: string;
    name: string;
    icon: string;
    totalIndicators: number;
    completedIndicators: number;
    totalRequired: number;
    totalUploaded: number;
    progress: number;
  }[];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ============ Icon Mapping ============
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  GraduationCap,
  Trophy,
  School,
};

// ============ Domain Color Helpers ============
const domainBarColors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#10b981'];
const domainBarBgColors = ['#e0f2fe', '#ccfbf1', '#fef3c7', '#d1fae5'];

// ============ View Types ============
type View = 'home' | 'field' | 'dashboard' | 'login';

// ============ Main App Component ============
export default function QurtubahApp() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldWithDetails[]>([]);
  const [overallProgress, setOverallProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark mode state with lazy initializer
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('qurtubah_dark');
        if (stored !== null) return stored === 'true';
      } catch {
        // ignore
      }
    }
    return false;
  });

  // Check auth on mount - use lazy initializer pattern
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('qurtubah_auth');
        if (stored) return JSON.parse(stored);
      } catch {
        localStorage.removeItem('qurtubah_auth');
      }
    }
    return null;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('qurtubah_dark', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Fetch data
  const fetchFields = useCallback(async () => {
    try {
      const res = await fetch('/api/fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const data = await res.json();
        setOverallProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchFields(), fetchProgress()]);
      setLoading(false);
    };
    load();
  }, [fetchFields, fetchProgress]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchFields(), fetchProgress()]);
  }, [fetchFields, fetchProgress]);

  const handleLogin = (user: AuthUser) => {
    setAuthUser(user);
    localStorage.setItem('qurtubah_auth', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('qurtubah_auth');
    setCurrentView('home');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const navigateToField = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setCurrentView('field');
  };

  const navigateHome = () => {
    setSelectedFieldId(null);
    setCurrentView('home');
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 islamic-pattern transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-l from-white via-sky-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="h-0.5 bg-gradient-to-l from-amber-400 via-amber-500 to-amber-400" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Name */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={navigateHome}>
              <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-12 w-12 object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all" />
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-base font-bold text-sky-900 dark:text-sky-100 leading-tight animate-fade-in">
                  مدارس قرطبة الأهلية
                </h1>
                <p className="text-xs text-sky-600 dark:text-sky-400">مجمع أبحر – نظام تقويم التعليم</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">معايير هيئة تقويم التعليم 2026</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                size="sm"
                onClick={navigateHome}
                className="gap-2 btn-press"
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </Button>
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="btn-press ml-1"
                title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
              </Button>
              {authUser ? (
                <>
                  <Button
                    variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentView('dashboard')}
                    className="gap-2 btn-press"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <div className="flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
                    <Shield className="h-4 w-4" />
                    <span>{authUser.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 btn-press">
                    <LogOut className="h-4 w-4" />
                    خروج
                  </Button>
                </>
              ) : (
                <Button
                  variant={currentView === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('login')}
                  className="gap-2 btn-press"
                >
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-1 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="btn-press"
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-sky-100 dark:border-slate-700 py-3 space-y-2">
              <Button
                variant={currentView === 'home' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => { navigateHome(); setMobileMenuOpen(false); }}
              >
                <Home className="h-4 w-4" />
                الرئيسية
              </Button>
              {authUser ? (
                <>
                  <Button
                    variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </Button>
                </>
              ) : (
                <Button
                  variant={currentView === 'login' ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }}
                >
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 page-transition">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-10 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 skeleton rounded-2xl" />
              </div>
              <div className="h-8 w-64 mx-auto skeleton mb-3" />
              <div className="h-5 w-48 mx-auto skeleton" />
            </div>
            <div className="h-40 skeleton mb-8 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 skeleton rounded-xl" />
              <div className="h-48 skeleton rounded-xl" />
              <div className="h-48 skeleton rounded-xl" />
              <div className="h-48 skeleton rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomePage
                fields={fields}
                overallProgress={overallProgress}
                onFieldClick={navigateToField}
              />
            )}
            {currentView === 'field' && selectedField && (
              <FieldDetailView
                field={selectedField}
                onBack={navigateHome}
                onRefresh={refreshData}
                onNavigateToField={navigateToField}
              />
            )}
            {currentView === 'dashboard' && authUser && (
              <DashboardView
                fields={fields}
                onRefresh={refreshData}
              />
            )}
            {currentView === 'login' && !authUser && (
              <LoginView onLogin={handleLogin} />
            )}
            {currentView === 'login' && authUser && (
              <DashboardView fields={fields} onRefresh={refreshData} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="bg-gradient-to-b from-sky-900 to-sky-950 dark:from-slate-800 dark:to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* School Info */}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-10 w-10 object-contain brightness-0 invert" />
                  <span className="font-bold text-lg">مدارس قرطبة الأهلية</span>
                </div>
                <p className="text-sm text-sky-300 text-center sm:text-right">
                  مجمع أبحر – نظام تقويم التعليم
                </p>
                <p className="text-xs text-amber-400/80">معايير هيئة تقويم التعليم 2026</p>
              </div>
              {/* Quick Links */}
              <div className="flex flex-col items-center gap-3">
                <h4 className="font-semibold text-sky-200 mb-1">روابط سريعة</h4>
                <button onClick={navigateHome} className="text-sm text-sky-300 hover:text-white transition-colors flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  الرئيسية
                </button>
                {authUser && (
                  <button onClick={() => setCurrentView('dashboard')} className="text-sm text-sky-300 hover:text-white transition-colors flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </button>
                )}
              </div>
              {/* Contact */}
              <div className="flex flex-col items-center sm:items-end gap-3">
                <h4 className="font-semibold text-sky-200 mb-1">تواصل معنا</h4>
                <p className="text-sm text-sky-300 text-center sm:text-right">
                  مجمع أبحر – جدة
                </p>
                <p className="text-xs text-sky-400">نظام تقويم التعليم الإلكتروني</p>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright Bar */}
        <div className="bg-sky-950 dark:bg-slate-950 border-t border-sky-800/50 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-xs text-sky-400 text-center">
              نظام تقويم التعليم © {new Date().getFullYear()} مدارس قرطبة الأهلية – جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============ Circular Progress Component ============
function CircularProgress({ value, size = 80, strokeWidth = 6, className = '' }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return '#10b981';
    if (v >= 50) return '#f59e0b';
    if (v > 0) return '#0ea5e9';
    return '#cbd5e1';
  };

  return (
    <svg width={size} height={size} className={className} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor(value)}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease',
          '--circumference': circumference,
          '--offset': offset,
        } as React.CSSProperties}
      />
    </svg>
  );
}

// ============ Domain Color Mapping ============
const domainGradients: Record<string, { from: string; to: string; bg: string; text: string; iconBg: string; iconText: string; headerFrom: string; headerTo: string }> = {
  '0': { from: 'from-sky-400', to: 'to-sky-600', bg: 'bg-sky-50', text: 'text-sky-700', iconBg: 'bg-sky-100', iconText: 'text-sky-700', headerFrom: 'from-sky-400', headerTo: 'to-sky-700' },
  '1': { from: 'from-teal-400', to: 'to-teal-600', bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', iconText: 'text-teal-700', headerFrom: 'from-teal-400', headerTo: 'to-teal-700' },
  '2': { from: 'from-amber-400', to: 'to-amber-600', bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-700', headerFrom: 'from-amber-400', headerTo: 'to-amber-700' },
  '3': { from: 'from-emerald-400', to: 'to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', headerFrom: 'from-emerald-400', headerTo: 'to-emerald-700' },
};

// ============ Horizontal Bar Chart Component ============
function HorizontalBarChart({ fields }: { fields: FieldWithDetails[] }) {
  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-sky-600" />
          تقدم المجالات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => {
          const barColor = domainBarColors[index % 4];
          const barBg = domainBarBgColors[index % 4];
          return (
            <div key={field.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-sky-800 dark:text-sky-200 font-medium truncate max-w-[70%]">{field.name}</span>
                <span className="font-bold" style={{ color: barColor }}>{field.progress}%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: barBg }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${field.progress}%`,
                    backgroundColor: barColor,
                    animation: 'slide-right 1s ease-out',
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============ Donut Chart Component ============
function DonutChart({ fields, totalEvidence }: { fields: FieldWithDetails[]; totalEvidence: number }) {
  const evidenceCounts = fields.map((f) => f.totalUploaded);
  const total = evidenceCounts.reduce((a, b) => a + b, 0) || 1;
  const colors = domainBarColors;
  const size = 180;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const segments = evidenceCounts.reduce<{ pct: number; dashLength: number; dashGap: number; offset: number; color: string; count: number; name: string }[]>((acc, count, i) => {
    const pct = count / total;
    const dashLength = pct * circumference;
    const dashGap = circumference - dashLength;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength : 0;
    acc.push({ pct, dashLength, dashGap, offset, color: colors[i % colors.length], count, name: fields[i]?.name || '' });
    return acc;
  }, []);

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-sky-600" />
          توزيع الشواهد
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                className="dark:stroke-slate-700"
              />
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${seg.dashGap}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="butt"
                  style={{ transition: 'all 1s ease-out' }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-sky-900 dark:text-sky-100">{totalEvidence}</span>
              <span className="text-xs text-sky-500 dark:text-sky-400">شاهد</span>
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-sky-700 dark:text-sky-300 truncate flex-1">{field.name}</span>
                <span className="font-bold text-sky-900 dark:text-sky-100">{field.totalUploaded}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Pie Chart Icon (inline SVG) ============
function PieChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

// ============ Completion Status Grid Component ============
function CompletionStatusGrid({ fields }: { fields: FieldWithDetails[] }) {
  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          حالة إكمال المؤشرات
        </CardTitle>
        <div className="flex items-center gap-4 text-xs mt-2">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> مكتمل</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> قيد التنفيذ</div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" /> لم يبدأ</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, fIdx) => {
          const allIndicators = field.standards.flatMap((s) => s.indicators);
          const fColor = domainBarColors[fIdx % 4];
          return (
            <div key={field.id}>
              <p className="text-sm font-medium text-sky-800 dark:text-sky-200 mb-2">{field.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {allIndicators.map((ind) => {
                  const isComplete = ind.evidences.length >= ind.requiredEvidence;
                  const isInProgress = ind.evidences.length > 0 && !isComplete;
                  const dotColor = isComplete ? 'bg-emerald-400' : isInProgress ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600';
                  return (
                    <div
                      key={ind.id}
                      className={`w-4 h-4 rounded-full ${dotColor} transition-colors cursor-default`}
                      title={`${ind.name} (${ind.evidences.length}/${ind.requiredEvidence})`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============ Recent Activity Component ============
function RecentActivity({ fields, onFieldClick }: { fields: FieldWithDetails[]; onFieldClick: (id: string) => void }) {
  // Collect all evidence with context
  const allEvidence: { evName: string; evDate: string; indName: string; standardName: string; fieldId: string; fieldName: string }[] = [];
  fields.forEach((field) => {
    field.standards.forEach((std) => {
      std.indicators.forEach((ind) => {
        ind.evidences.forEach((ev) => {
          allEvidence.push({
            evName: ev.name,
            evDate: ev.createdAt,
            indName: ind.name,
            standardName: std.name,
            fieldId: field.id,
            fieldName: field.name,
          });
        });
      });
    });
  });

  // Sort by date descending and take top 5
  const recentItems = allEvidence
    .sort((a, b) => new Date(b.evDate).getTime() - new Date(a.evDate).getTime())
    .slice(0, 5);

  if (recentItems.length === 0) return null;

  return (
    <Card className="border-sky-200 dark:border-slate-700 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-sky-900 dark:text-sky-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          آخر النشاطات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentItems.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-sky-50/50 dark:bg-slate-800/50 hover:bg-sky-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
            onClick={() => onFieldClick(item.fieldId)}
          >
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-100 truncate">{item.evName}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400 truncate">{item.indName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">{item.fieldName}</Badge>
                <span className="text-[10px] text-sky-400 dark:text-sky-500">
                  {new Date(item.evDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============ Home Page Component ============
function HomePage({
  fields,
  overallProgress,
  onFieldClick,
}: {
  fields: FieldWithDetails[];
  overallProgress: ProgressData | null;
  onFieldClick: (id: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFields = fields.filter((f) =>
    f.name.includes(searchTerm) || (f.description && f.description.includes(searchTerm))
  );

  const totalEvidence = fields.reduce((sum, f) => sum + f.totalUploaded, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-20 w-20 object-contain drop-shadow-lg" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-900 dark:text-sky-100 mb-2">
          نظام تقويم التعليم
        </h2>
        <p className="text-sky-600 dark:text-sky-400 text-sm sm:text-base mb-1">
          مدارس قرطبة الأهلية – مجمع أبحر
        </p>
        <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">
          معايير هيئة تقويم التعليم 2026
        </p>
      </div>

      {/* Overall Progress Card */}
      {overallProgress && (
        <Card className="mb-8 border-sky-200 dark:border-slate-700 overflow-hidden relative animate-slide-up glassmorphism glow-sky">
          <div className="absolute top-0 left-0 w-full h-1 bg-sky-100 dark:bg-slate-700">
            <div
              className="h-full bg-gradient-to-l from-sky-500 to-sky-700 transition-all duration-700"
              style={{ width: `${overallProgress.progress}%` }}
            />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-sky-900 dark:text-sky-100">التقدم العام</CardTitle>
              <div className="flex items-center gap-4">
                {/* Circular Progress */}
                <div className="relative">
                  <CircularProgress value={overallProgress.progress} size={64} strokeWidth={5} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold gradient-text">{overallProgress.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress.progress} className="h-3 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-2 rounded-xl bg-sky-50/80 dark:bg-slate-800/50">
                <p className="text-2xl font-bold gradient-text">{overallProgress.totalFields}</p>
                <p className="text-xs text-sky-500 dark:text-sky-400">المجالات</p>
              </div>
              <div className="p-2 rounded-xl bg-sky-50/80 dark:bg-slate-800/50">
                <p className="text-2xl font-bold gradient-text">{overallProgress.totalIndicators}</p>
                <p className="text-xs text-sky-500 dark:text-sky-400">المؤشرات</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-slate-800/50">
                <p className="text-2xl font-bold gradient-text-emerald">{overallProgress.completedIndicators}</p>
                <p className="text-xs text-sky-500 dark:text-sky-400">مكتملة</p>
              </div>
              <div className="p-2 rounded-xl bg-sky-50/80 dark:bg-slate-800/50">
                <p className="text-2xl font-bold gradient-text">{overallProgress.totalUploaded}</p>
                <p className="text-xs text-sky-500 dark:text-sky-400">الشواهد المرفوعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="mb-6 animate-fade-in">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث في المجالات..."
            className="pr-9 text-center dark:bg-slate-800 dark:border-slate-700"
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
      <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 mb-6 animate-fade-in">مجالات التقويم</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFields.map((field, index) => {
          const originalIndex = fields.indexOf(field);
          const IconComponent = iconMap[field.icon || 'Building2'] || Building2;
          const colors = domainGradients[String(originalIndex % 4)] || domainGradients['0'];
          return (
            <Card
              key={field.id}
              className={`cursor-pointer card-lift transition-all duration-300 border-sky-200 dark:border-slate-700 hover:border-sky-400 group overflow-hidden animate-fade-in stagger-${index + 1}`}
              onClick={() => onFieldClick(field.id)}
            >
              <div className={`h-2 bg-gradient-to-l ${colors.from} ${colors.to} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 10px)' }} />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg} ${colors.iconText} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-sky-900 dark:text-sky-100">{field.name}</CardTitle>
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
              <CardContent className="pt-0">
                <Progress value={field.progress} className="h-2.5 mb-3" />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className={colors.text}>
                      {field.standardsCount} معايير
                    </span>
                    <span className={colors.text}>
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
                      field.progress === 100 ? 'gradient-text-emerald' :
                      field.progress > 0 ? 'gradient-text-gold' : 'text-sky-400'
                    }`}>
                      {field.progress}%
                    </span>
                  </div>
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

      {/* Data Visualization Charts Section */}
      {overallProgress && (
        <div className="mt-10 space-y-6">
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 animate-fade-in">التحليل البصري</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorizontalBarChart fields={fields} />
            <DonutChart fields={fields} totalEvidence={totalEvidence} />
          </div>
          <CompletionStatusGrid fields={fields} />
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="mt-10">
        <RecentActivity fields={fields} onFieldClick={onFieldClick} />
      </div>

      {/* Statistics Section */}
      {overallProgress && (
        <div className="mt-10 animate-slide-up">
          <h3 className="text-xl font-bold text-sky-900 dark:text-sky-100 mb-4">إحصائيات سريعة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <BarChart3 className="h-5 w-5 text-sky-600" />
              </div>
              <p className="text-2xl font-bold gradient-text">{overallProgress.totalRequired}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">الشواهد المطلوبة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <Upload className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold gradient-text-emerald">{overallProgress.totalUploaded}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">الشواهد المرفوعة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold gradient-text-gold">{overallProgress.completedIndicators}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">مؤشرات مكتملة</p>
            </Card>
            <Card className="border-sky-200 dark:border-slate-700 text-center p-4 card-lift">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-2">
                <Trophy className="h-5 w-5 text-sky-600" />
              </div>
              <p className="text-2xl font-bold gradient-text">{overallProgress.progress}%</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Field Detail View ============
function FieldDetailView({
  field,
  onBack,
  onRefresh,
  onNavigateToField,
}: {
  field: FieldWithDetails;
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

  // Form state
  const [evidenceName, setEvidenceName] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const openAddEvidence = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setEditingEvidence(null);
    setEvidenceName('');
    setEvidenceLink('');
    setEvidenceFile(null);
    setEvidenceDialogOpen(true);
  };

  const openEditEvidence = (evidence: Evidence) => {
    setSelectedIndicatorId(evidence.indicatorId);
    setEditingEvidence(evidence);
    setEvidenceName(evidence.name);
    setEvidenceLink(evidence.link || '');
    setEvidenceFile(null);
    setEvidenceDialogOpen(true);
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
            link: evidenceLink || null,
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
            link: evidenceLink || null,
            fileName,
            filePath,
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

  // Filter indicators by search
  const filteredStandards = field.standards.map((std) => ({
    ...std,
    indicators: std.indicators.filter((ind) =>
      !indicatorSearch || ind.name.includes(indicatorSearch)
    ),
  })).filter((std) => std.indicators.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 mb-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-sky-600 dark:text-sky-400 btn-press">
          <ChevronRight className="h-4 w-4" />
          العودة للرئيسية
        </Button>
      </div>

      {/* Field Header - Hero Banner */}
      <Card className="mb-8 border-sky-200 dark:border-slate-700 overflow-hidden animate-slide-up shadow-lg">
        <div className={`h-3 bg-gradient-to-l ${domainColors.from} ${domainColors.to} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(255,255,255,0.3) 12px, rgba(255,255,255,0.3) 14px)' }} />
        </div>
        <CardHeader className={`bg-gradient-to-l ${domainColors.bg}/50 to-white dark:to-slate-900`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${domainColors.iconBg} ${domainColors.iconText} shadow-md`}>
              <IconComponent className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-2xl ${domainColors.text}`}>{field.name}</CardTitle>
              <CardDescription className={`${domainColors.text} mt-1`}>{field.description}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Circular Progress */}
              <div className="relative">
                <CircularProgress value={field.progress} size={72} strokeWidth={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${domainColors.text}`}>{field.progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`pt-0 bg-gradient-to-l ${domainColors.bg}/30 to-white dark:to-slate-900`}>
          <Progress value={field.progress} className="h-3 mb-3" />
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
        </CardContent>
      </Card>

      {/* Indicator Search/Filter */}
      <div className="mb-6 animate-fade-in">
        <div className="relative max-w-md">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
          <Input
            value={indicatorSearch}
            onChange={(e) => setIndicatorSearch(e.target.value)}
            placeholder="ابحث في المؤشرات..."
            className="pr-9 dark:bg-slate-800 dark:border-slate-700"
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
            <Card key={standard.id} className={`border-sky-200 dark:border-slate-700 overflow-hidden animate-fade-in stagger-${Math.min(sIdx + 1, 8)} transition-all duration-300 ${isExpanded ? 'shadow-md' : ''}`}>
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
                      <CardTitle className="text-base text-sky-900 dark:text-sky-100">{standard.name}</CardTitle>
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
                          className={`p-4 rounded-xl border ${
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
                            </div>
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
                                  className="evidence-card flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 text-sm"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {ev.filePath ? (
                                      <div className="p-1 rounded bg-red-50 dark:bg-red-900/20">
                                        <FileText className="h-4 w-4 text-red-500 shrink-0" />
                                      </div>
                                    ) : ev.link ? (
                                      <div className="p-1 rounded bg-blue-50 dark:bg-blue-900/20">
                                        <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
                                      </div>
                                    ) : (
                                      <div className="p-1 rounded bg-sky-50 dark:bg-sky-900/20">
                                        <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="truncate text-sky-800 dark:text-sky-200 block">{ev.name}</span>
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
                                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                        <a href={ev.filePath} target="_blank" rel="noopener noreferrer">
                                          <Download className="h-3.5 w-3.5" />
                                        </a>
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
    </div>
  );
}

// ============ Login View ============
function LoginView({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data.user);
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        setError(data.error || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 islamic-pattern relative">
      {/* Decorative background circles */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-amber-200/15 rounded-full blur-3xl" />

      {/* School Name Above Card */}
      <div className="text-center mb-6 animate-fade-in relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
          مدارس قرطبة الأهلية
        </h2>
        <p className="text-sky-600 dark:text-sky-400 text-sm">مجمع أبحر – نظام تقويم التعليم</p>
      </div>

      <Card className="w-full max-w-md border-sky-200 dark:border-slate-700 shadow-xl glassmorphism animate-slide-up relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 shadow-inner">
              <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-16 w-16 object-contain" />
            </div>
          </div>
          <CardTitle className="text-xl text-sky-900 dark:text-sky-100">لوحة التحكم</CardTitle>
          <CardDescription className="text-sky-600 dark:text-sky-400">
            أدخل كلمة المرور للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="text-center focus:ring-2 focus:ring-sky-300 transition-shadow dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              className="w-full gap-2 btn-press shadow-md hover:shadow-lg transition-shadow"
              disabled={loading || !password}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              تسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Dashboard View ============
function DashboardView({
  fields,
  onRefresh,
}: {
  fields: FieldWithDetails[];
  onRefresh: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState('fields');

  // Compute dashboard stats
  const totalStandards = fields.reduce((sum, f) => sum + f.standardsCount, 0);
  const totalIndicators = fields.reduce((sum, f) => sum + f.indicatorsCount, 0);
  const totalRequired = fields.reduce((sum, f) => sum + f.totalRequired, 0);
  const totalUploaded = fields.reduce((sum, f) => sum + f.totalUploaded, 0);
  const completedIndicators = fields.reduce((sum, f) => sum + f.completedIndicators, 0);
  const overallProgress = totalRequired > 0 ? Math.round((totalUploaded / totalRequired) * 100) : 0;

  // Enhanced Print Report
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" alt="شعار مدارس قرطبة" />
          <div>
            <h1 style="margin:0;border:none;padding:0;">تقرير تقويم التعليم</h1>
            <p style="color:#64748b;margin:5px 0;">مدارس قرطبة الأهلية – مجمع أبحر</p>
            <p style="color:#d97706;font-size:12px;">معايير هيئة تقويم التعليم 2026 | تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </div>

        <div class="stats">
          <div class="stat-box"><div class="value">${overallProgress}%</div><div class="label">نسبة الإنجاز</div></div>
          <div class="stat-box"><div class="value">${totalIndicators}</div><div class="label">المؤشرات</div></div>
          <div class="stat-box"><div class="value">${completedIndicators}</div><div class="label">مكتملة</div></div>
          <div class="stat-box"><div class="value">${totalUploaded}</div><div class="label">الشواهد</div></div>
        </div>

        <div class="progress-bar"><div class="progress-fill" style="width:${overallProgress}%"></div></div>

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

        <div style="margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;">
          نظام تقويم التعليم © ${new Date().getFullYear()} مدارس قرطبة الأهلية
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        summary: { totalFields: fields.length, totalStandards, totalIndicators, completedIndicators, totalRequired, totalUploaded, overallProgress },
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 text-sky-700 dark:text-sky-300 shadow-sm">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-sky-900 dark:text-sky-100">لوحة التحكم</h2>
            <p className="text-sm text-sky-600 dark:text-sky-400">إدارة المجالات والمعايير والمؤشرات والشواهد</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handleExportJSON}>
            <FileJson className="h-4 w-4" />
            تصدير JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-2 btn-press" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            طباعة التقرير
          </Button>
        </div>
      </div>

      {/* Enhanced Dashboard Visual Summary */}
      <Card className="mb-6 border-sky-200 dark:border-slate-700 overflow-hidden animate-slide-up">
        <CardHeader className="pb-3 bg-gradient-to-l from-sky-50 to-white dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="text-lg text-sky-900 dark:text-sky-100">ملخص بصري</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Overall Progress Ring */}
            <div className="relative shrink-0">
              <CircularProgress value={overallProgress} size={120} strokeWidth={8} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-sky-900 dark:text-sky-100">{overallProgress}%</span>
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
                      <CircularProgress value={field.progress} size={52} strokeWidth={4} />
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
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800 text-center">
              <Building2 className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{fields.length}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المجالات</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-slate-800 text-center">
              <GraduationCap className="h-5 w-5 text-teal-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{totalStandards}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المعايير</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-slate-800 text-center">
              <BarChart3 className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-gold">{totalIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">المؤشرات</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-slate-800 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text-emerald">{completedIndicators}</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">مكتملة</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-800 text-center col-span-2 sm:col-span-1">
              <Trophy className="h-5 w-5 text-sky-600 mx-auto mb-1" />
              <p className="text-xl font-bold gradient-text">{overallProgress}%</p>
              <p className="text-[10px] text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards (legacy, kept for backward compat) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 animate-slide-up">
        <Card className="border-sky-200 dark:border-slate-700 p-3 text-center card-lift">
          <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-1">
            <Building2 className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold gradient-text">{fields.length}</p>
          <p className="text-[10px] text-sky-500 dark:text-sky-400">المجالات</p>
        </Card>
        <Card className="border-sky-200 dark:border-slate-700 p-3 text-center card-lift">
          <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-slate-800 w-fit mx-auto mb-1">
            <GraduationCap className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold gradient-text">{totalStandards}</p>
          <p className="text-[10px] text-sky-500 dark:text-sky-400">المعايير</p>
        </Card>
        <Card className="border-sky-200 dark:border-slate-700 p-3 text-center card-lift">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-slate-800 w-fit mx-auto mb-1">
            <BarChart3 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold gradient-text-gold">{totalIndicators}</p>
          <p className="text-[10px] text-sky-500 dark:text-sky-400">المؤشرات</p>
        </Card>
        <Card className="border-sky-200 dark:border-slate-700 p-3 text-center card-lift">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-slate-800 w-fit mx-auto mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold gradient-text-emerald">{completedIndicators}</p>
          <p className="text-[10px] text-sky-500 dark:text-sky-400">مكتملة</p>
        </Card>
        <Card className="border-sky-200 dark:border-slate-700 p-3 text-center card-lift col-span-2 sm:col-span-1">
          <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-slate-800 w-fit mx-auto mb-1">
            <Trophy className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold gradient-text">{overallProgress}%</p>
          <p className="text-[10px] text-sky-500 dark:text-sky-400">نسبة الإنجاز</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
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
        </TabsList>

        <TabsContent value="fields">
          <FieldsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="standards">
          <StandardsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="indicators">
          <IndicatorsManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
        <TabsContent value="evidence">
          <EvidenceManager fields={fields} onRefresh={onRefresh} />
        </TabsContent>
      </Tabs>
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
        <Table>
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
              <TableRow key={field.id} className={`enhanced-table-row ${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-sky-50/30 dark:bg-slate-800/30'}`}>
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
        <Table>
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
                <TableRow key={std.id} className={`${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-sky-50/30 dark:bg-slate-800/30'} hover:bg-sky-50/60 dark:hover:bg-slate-700/40 transition-colors`}>
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
        <Table>
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
                <TableRow key={ind.id} className={`${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-sky-50/30 dark:bg-slate-800/30'} hover:bg-sky-50/60 dark:hover:bg-slate-700/40 transition-colors`}>
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

// ============ Evidence Manager ============
function EvidenceManager({ fields, onRefresh }: { fields: FieldWithDetails[]; onRefresh: () => Promise<void> }) {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const filteredEvidence = evidenceList.filter((ev) =>
    ev.name.includes(searchTerm) ||
    ev.indicator?.name?.includes(searchTerm) ||
    ev.indicator?.standard?.name?.includes(searchTerm) ||
    ev.indicator?.standard?.field?.name?.includes(searchTerm)
  );

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
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في الشواهد..."
            className="pr-9 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
      </div>

      <div className="rounded-xl border border-sky-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-l from-sky-50 to-sky-100/80 dark:from-slate-800 dark:to-slate-900">
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الشاهد</TableHead>
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
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-sky-600" />
                </TableCell>
              </TableRow>
            ) : (
              filteredEvidence.map((ev, i) => (
                <TableRow key={ev.id} className={`${i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-sky-50/30 dark:bg-slate-800/30'} hover:bg-sky-50/60 dark:hover:bg-slate-700/40 transition-colors`}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium dark:text-sky-100">{ev.name}</TableCell>
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
                <TableCell colSpan={7} className="text-center text-sky-400 py-8">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد شواهد بعد'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
