'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Home, LogIn, LogOut,
  LayoutDashboard, Shield, X, Menu,
  Moon, Sun, Bell, HelpCircle, Youtube, Phone, CheckCheck,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { FieldWithDetails, ProgressData, AuthUser, AppNotification, View } from '@/components/qurtubah/types';

// Dynamic imports for large view components to reduce initial bundle
const HomePage = dynamic(() => import('@/components/qurtubah/HomePage').then((m) => ({ default: m.HomePage })), { ssr: false });
const FieldDetailView = dynamic(() => import('@/components/qurtubah/FieldDetailView').then((m) => ({ default: m.FieldDetailView })), { ssr: false });
const LoginView = dynamic(() => import('@/components/qurtubah/LoginView').then((m) => ({ default: m.LoginView })), { ssr: false });
const DashboardView = dynamic(() => import('@/components/qurtubah/DashboardView').then((m) => ({ default: m.DashboardView })), { ssr: false });

// ============ Main App Component ============
export default function QurtubahApp() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [quickAddIndicatorId, setQuickAddIndicatorId] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldWithDetails[]>([]);
  const [overallProgress, setOverallProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('qurtubah_notifications');
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: go back to home view
      if (e.key === 'Escape' && currentView !== 'home') {
        setSelectedFieldId(null);
        setCurrentView('home');
      }
      // Ctrl+D: toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDarkMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Back-to-top visibility listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Generate notifications from fields data
  const generateNotifications = useCallback((fieldsData: FieldWithDetails[], progressData: ProgressData | null) => {
    const newNotifications: AppNotification[] = [];
    const now = new Date().toISOString();

    fieldsData.forEach((field) => {
      if (field.progress === 100) {
        newNotifications.push({
          id: `milestone-100-${field.id}`,
          type: 'milestone',
          title: 'إنجاز كامل! 🏆',
          message: `تم إكمال مجال "${field.name}" بالكامل`,
          time: now,
          read: false,
        });
      } else if (field.progress >= 50) {
        newNotifications.push({
          id: `milestone-50-${field.id}`,
          type: 'milestone',
          title: 'منتصف الطريق 📈',
          message: `مجال "${field.name}" وصل إلى ${field.progress}%`,
          time: now,
          read: false,
        });
      } else if (field.progress === 0) {
        newNotifications.push({
          id: `warning-0-${field.id}`,
          type: 'warning',
          title: 'مجال بدون تقدم ⚠️',
          message: `مجال "${field.name}" لم يبدأ بعد`,
          time: now,
          read: false,
        });
      }
    });

    if (progressData && progressData.progress >= 50) {
      newNotifications.push({
        id: 'overall-milestone-50',
        type: 'milestone',
        title: 'تقدم عام ممتاز! 🎯',
        message: `التقدم العام وصل إلى ${progressData.progress}%`,
        time: now,
        read: false,
      });
    }

    // Info notification about system usage
    if (progressData && fieldsData.length > 0) {
      newNotifications.push({
        id: 'info-system-usage',
        type: 'info',
        title: 'نصيحة الاستخدام 💡',
        message: `لديك ${progressData.totalRequired - progressData.totalUploaded} شاهد متبقي لإكمال التقويم`,
        time: now,
        read: false,
      });
    }

    return newNotifications;
  }, []);

  // Update notifications when fields data changes
  useEffect(() => {
    if (fields.length === 0) return;
    const generated = generateNotifications(fields, overallProgress);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const merged = [...prev];
      generated.forEach((n) => {
        if (!existingIds.has(n.id)) {
          merged.unshift(n);
        }
      });
      const trimmed = merged.slice(0, 50);
      try {
        localStorage.setItem('qurtubah_notifications', JSON.stringify(trimmed));
      } catch {
        // ignore
      }
      return trimmed;
    });
  }, [fields, overallProgress, generateNotifications]);

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('qurtubah_notifications', JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Help onboarding dismissed state
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('qurtubah_onboarding_dismissed') === 'true';
      } catch {
        // ignore
      }
    }
    return false;
  });

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

  const handleQuickAddEvidence = (indicatorId: string) => {
    // Find which field contains this indicator
    const field = fields.find((f) =>
      f.standards.some((s) => s.indicators.some((ind) => ind.id === indicatorId))
    );
    if (field) {
      setQuickAddIndicatorId(indicatorId);
      setSelectedFieldId(field.id);
      setCurrentView('field');
    }
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
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="btn-press ml-1"
                  title="الإشعارات"
                >
                  <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce-in">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {notificationOpen && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-sky-200 dark:border-slate-700 z-50 animate-fade-in">
                    <div className="p-3 border-b border-sky-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-bold text-sky-900 dark:text-sky-100">الإشعارات</span>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs text-sky-600 h-6 gap-1" onClick={markAllAsRead}>
                          <CheckCheck className="h-3 w-3" />
                          تحديد الكل كمقروء
                        </Button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sky-400 text-sm">لا توجد إشعارات</div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 border-b border-sky-50 dark:border-slate-700/50 last:border-0 ${
                              !n.read ? 'bg-sky-50/50 dark:bg-slate-700/30' : ''
                            }`}
                            style={{ borderRightWidth: '3px', borderRightStyle: 'solid', borderRightColor: n.type === 'milestone' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#0ea5e9' }}
                          >
                            <p className="text-sm font-medium text-sky-900 dark:text-sky-100">{n.title}</p>
                            <p className="text-xs text-sky-500 dark:text-sky-400 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-sky-400 dark:text-sky-500 mt-1">{new Date(n.time).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-sky-100 dark:border-slate-700">
                        <Button variant="ghost" size="sm" className="w-full text-xs text-sky-600 dark:text-sky-400" onClick={() => { markAllAsRead(); setNotificationOpen(false); }}>
                          إغلاق الكل
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="btn-press ml-1"
                title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                <span className="dark-mode-icon" style={{ transform: darkMode ? 'rotate(360deg)' : 'rotate(0deg)' }}>
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
                </span>
              </Button>
              {/* Help Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="btn-press ml-1"
                title="دليل الاستخدام"
              >
                <HelpCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
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
              {/* Mobile Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="btn-press"
                >
                  <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="btn-press"
              >
                <HelpCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="btn-press"
              >
                <span className="dark-mode-icon" style={{ transform: darkMode ? 'rotate(360deg)' : 'rotate(0deg)' }}>
                  {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-600" />}
                </span>
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
            <>
              {/* Overlay */}
              <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
              {/* Panel */}
              <div className="mobile-menu-panel p-4">
                {/* Close button */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-sky-100 dark:border-slate-700">
                  <span className="text-sm font-bold text-sky-900 dark:text-sky-100">القائمة</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="mobile-menu-item" style={{ animationDelay: '0.05s' }}>
                    <Button
                      variant={currentView === 'home' ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => { navigateHome(); setMobileMenuOpen(false); }}
                    >
                      <Home className="h-4 w-4" />
                      الرئيسية
                    </Button>
                  </div>
                  <div className="mobile-menu-item" style={{ animationDelay: '0.1s' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => { setNotificationOpen(true); setMobileMenuOpen(false); }}
                    >
                      <Bell className="h-4 w-4" />
                      الإشعارات
                      {unreadCount > 0 && (
                        <span className="mr-auto h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </div>
                  <div className="mobile-menu-item" style={{ animationDelay: '0.15s' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => { setHelpOpen(true); setMobileMenuOpen(false); }}
                    >
                      <HelpCircle className="h-4 w-4" />
                      دليل الاستخدام
                    </Button>
                  </div>
                  {authUser ? (
                    <>
                      <div className="mobile-menu-item" style={{ animationDelay: '0.2s' }}>
                        <Button
                          variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          لوحة التحكم
                        </Button>
                      </div>
                      <div className="mobile-menu-item" style={{ animationDelay: '0.25s' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-red-600 hover:text-red-700"
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                        >
                          <LogOut className="h-4 w-4" />
                          تسجيل الخروج
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="mobile-menu-item" style={{ animationDelay: '0.2s' }}>
                      <Button
                        variant={currentView === 'login' ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }}
                      >
                        <LogIn className="h-4 w-4" />
                        تسجيل الدخول
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-10 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 skeleton skeleton-wave skeleton-circle" />
              </div>
              <div className="h-8 w-64 mx-auto skeleton skeleton-wave skeleton-heading mb-3" />
              <div className="h-5 w-48 mx-auto skeleton skeleton-wave skeleton-line" />
              <div className="h-4 w-32 mx-auto skeleton skeleton-wave skeleton-text mt-2" />
            </div>
            <div className="h-40 skeleton skeleton-wave mb-8 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-xl border border-sky-100/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 skeleton skeleton-wave skeleton-circle" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 skeleton skeleton-wave skeleton-line" />
                      <div className="h-3 w-1/2 skeleton skeleton-wave skeleton-text" />
                    </div>
                  </div>
                  <div className="h-2 skeleton skeleton-wave skeleton-line" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 skeleton skeleton-wave skeleton-badge" />
                    <div className="h-5 w-16 skeleton skeleton-wave skeleton-badge" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <HomePage
                  fields={fields}
                  overallProgress={overallProgress}
                  onFieldClick={navigateToField}
                  onRefresh={refreshData}
                  onQuickAddEvidence={handleQuickAddEvidence}
                />
              </motion.div>
            )}
            {currentView === 'field' && selectedField && (
              <motion.div
                key="field"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <FieldDetailView
                  field={selectedField}
                  fields={fields}
                  onBack={navigateHome}
                  onRefresh={refreshData}
                  onNavigateToField={navigateToField}
                  quickAddIndicatorId={quickAddIndicatorId}
                  onQuickAddConsumed={() => setQuickAddIndicatorId(null)}
                />
              </motion.div>
            )}
            {currentView === 'dashboard' && authUser && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardView
                  fields={fields}
                  onRefresh={refreshData}
                />
              </motion.div>
            )}
            {currentView === 'login' && !authUser && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginView onLogin={handleLogin} />
              </motion.div>
            )}
            {currentView === 'login' && authUser && (
              <motion.div
                key="dashboard-redirect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardView fields={fields} onRefresh={refreshData} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="footer-wave-enhanced" />
        <div className="bg-gradient-to-b from-sky-900 to-sky-950 dark:from-slate-800 dark:to-slate-900 text-white footer-shimmer-border footer-pattern relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {/* Quick Stats Row */}
            <div className="footer-quick-stats mb-4 pb-3 border-b border-sky-700/30">
              <span><span className="stat-dot" /> 4 مجالات</span>
              <span><span className="stat-dot" /> 11 معيار</span>
              <span><span className="stat-dot" /> 52 مؤشر</span>
              <span><span className="stat-dot" /> {overallProgress ? `${overallProgress.progress}% إنجاز` : '—'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* School Info */}
              <div className="flex flex-col items-center sm:items-start gap-3 footer-column-separator">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-10 w-10 object-contain brightness-0 invert" />
                  <span className="font-bold text-lg">مدارس قرطبة الأهلية</span>
                </div>
                <p className="text-sm text-sky-300 text-center sm:text-right">
                  مجمع أبحر – نظام تقويم التعليم
                </p>
                <p className="text-xs text-amber-400/80">معايير هيئة تقويم التعليم 2026</p>
                <p className="text-xs text-sky-400/70">العام الدراسي 2025-2026</p>
              </div>
              {/* Quick Links */}
              <div className="flex flex-col items-center gap-3 footer-column-separator">
                <h4 className="font-semibold text-sky-200 mb-1">روابط سريعة</h4>
                <div className="footer-dot-separator">
                  <button onClick={navigateHome} className="text-sm text-sky-300 hover:text-white transition-colors flex items-center gap-2 footer-link">
                    <Home className="h-4 w-4" />
                    الرئيسية
                  </button>
                </div>
                {authUser && (
                  <div className="footer-dot-separator">
                    <button onClick={() => setCurrentView('dashboard')} className="text-sm text-sky-300 hover:text-white transition-colors flex items-center gap-2 footer-link">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </button>
                  </div>
                )}
              </div>
              {/* Contact & Social */}
              <div className="flex flex-col items-center sm:items-end gap-3">
                <h4 className="font-semibold text-sky-200 mb-1">تواصل معنا</h4>
                <p className="text-sm text-sky-300 text-center sm:text-right">
                  مجمع أبحر – جدة
                </p>
                <div className="footer-separator w-full" />
                <p className="text-xs text-sky-400">نظام تقويم التعليم الإلكتروني</p>
                {/* Social Media Links */}
                <div className="flex items-center gap-3 mt-2">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link text-sky-400 hover:text-white" title="Twitter / X">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link text-sky-400 hover:text-white" title="YouTube">
                    <Youtube className="h-4 w-4" />
                  </a>
                  <a href="tel:+966123456789" className="social-link text-sky-400 hover:text-white" title="هاتف">
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Copyright Bar */}
        <div className="bg-sky-950 dark:bg-slate-950 border-t border-sky-800/50 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-sky-400">
                نظام تقويم التعليم © {new Date().getFullYear()} مدارس قرطبة الأهلية – جميع الحقوق محفوظة
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[10px] text-sky-500/60 cursor-help flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-sky-900/60 text-sky-400/70 text-[9px] font-mono">Esc</kbd>
                      <span>الرئيسية</span>
                      <span className="mx-1">•</span>
                      <kbd className="px-1 py-0.5 rounded bg-sky-900/60 text-sky-400/70 text-[9px] font-mono">Ctrl+D</kbd>
                      <span>الوضع الداكن</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    اختصارات لوحة المفاتيح
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Notification Dropdown - shown as dialog on mobile */}
      <Dialog open={notificationOpen && typeof window !== 'undefined' && window.innerWidth < 768} onOpenChange={setNotificationOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-sky-600" />
                الإشعارات
              </DialogTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-sky-600 h-6 gap-1" onClick={markAllAsRead}>
                  <CheckCheck className="h-3 w-3" />
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sky-400 text-sm">لا توجد إشعارات</div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg ${
                    !n.read ? 'bg-sky-50 dark:bg-slate-700/30' : ''
                  }`}
                  style={{ borderRightWidth: '3px', borderRightStyle: 'solid', borderRightColor: n.type === 'milestone' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#0ea5e9' }}
                >
                  <p className="text-sm font-medium text-sky-900 dark:text-sky-100">{n.title}</p>
                  <p className="text-xs text-sky-500 dark:text-sky-400 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-sky-400 dark:text-sky-500 mt-1">{new Date(n.time).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationOpen(false)} className="w-full">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help / Onboarding Dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="h-6 w-6 text-sky-600" />
              دليل استخدام النظام
            </DialogTitle>
            <DialogDescription>
              تعرّف على كيفية استخدام نظام تقويم التعليم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">📊</span>
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">الرئيسية</p>
                <p className="text-sm text-sky-600 dark:text-sky-400">عرض نظرة عامة على تقدم التقويم والمجالات والشواهد</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">📁</span>
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">المجالات</p>
                <p className="text-sm text-sky-600 dark:text-sky-400">انقر على أي مجال لعرض التفاصيل والمعايير والمؤشرات</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">📝</span>
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">الشواهد</p>
                <p className="text-sm text-sky-600 dark:text-sky-400">أضف شواهد لكل مؤشر (رابط أو ملف) مع تحديد الحالة</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">🔐</span>
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">لوحة التحكم</p>
                <p className="text-sm text-sky-600 dark:text-sky-400">سجل الدخول لإدارة البيانات والشواهد والتقارير</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700">
              <span className="text-2xl shrink-0">⌨️</span>
              <div>
                <p className="font-medium text-sky-900 dark:text-sky-100">اختصارات</p>
                <p className="text-sm text-sky-600 dark:text-sky-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-mono">Esc</kbd> العودة للرئيسية &nbsp;•&nbsp;
                  <kbd className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-mono">Ctrl+D</kbd> الوضع الداكن
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full gap-2"
              onClick={() => {
                setHelpOpen(false);
                setOnboardingDismissed(true);
                localStorage.setItem('qurtubah_onboarding_dismissed', 'true');
              }}
            >
              فهمت!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back-to-Top Floating Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="fixed bottom-6 left-6 z-50 h-11 w-11 rounded-full bg-gradient-to-b from-sky-500 to-sky-600 dark:from-sky-600 dark:to-sky-700 text-white shadow-lg shadow-sky-500/30 dark:shadow-sky-700/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 no-print"
            aria-label="العودة للأعلى"
            title="العودة للأعلى"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
