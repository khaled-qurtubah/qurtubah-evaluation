'use client';

import React, { useState, useEffect } from 'react';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { AuthUser } from './types';

// ============ Google SVG Icon ============
export function GoogleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ============ Login View ============
export function LoginView({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleOAuthAvailable, setGoogleOAuthAvailable] = useState(false);

  // Check if Google OAuth is configured
  useEffect(() => {
    const checkGoogleOAuth = async () => {
      try {
        const res = await fetch('/api/auth/providers');
        if (res.ok) {
          const providers = await res.json();
          setGoogleOAuthAvailable(!!providers.google);
        }
      } catch {
        setGoogleOAuthAvailable(false);
      }
    };
    checkGoogleOAuth();
  }, []);

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Dynamically import next-auth/react signIn
      const { signIn: nextAuthSignIn } = await import('next-auth/react');
      const result = await nextAuthSignIn('google', { callbackUrl: '/' });
      if (result === undefined) {
        // signIn redirects, this is expected for OAuth
      }
    } catch {
      toast.error('فشل تسجيل الدخول عبر Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 login-islamic-pattern relative">
      {/* Shield watermark */}
      <div className="login-shield-watermark" />
      {/* Decorative background circles */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-amber-200/15 rounded-full blur-3xl" />

      {/* School Name Above Card */}
      <div className="text-center mb-6 animate-fade-in relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-1">
          مدارس قرطبة الأهلية
        </h2>
        <div className="login-gradient-line w-32 mx-auto mt-2 mb-2" />
        <p className="text-sky-600 dark:text-sky-400 text-sm">مجمع أبحر – نظام تقويم التعليم</p>
      </div>

      <Card className={`w-full max-w-md border-sky-200 dark:border-slate-700 shadow-xl glassmorphism login-card-glow login-sparkle animate-slide-up relative z-10 ${error ? 'login-shake' : ''}`}>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-slate-700 dark:to-slate-800 shadow-inner login-badge-shield">
              <img src="/logo.png" alt="شعار مدارس قرطبة" className="h-16 w-16 object-contain animate-float" />
            </div>
          </div>
          <CardTitle className="text-xl text-sky-900 dark:text-sky-100">لوحة التحكم</CardTitle>
          <CardDescription className="text-sky-600 dark:text-sky-400 typing-cursor">
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
                className="text-center login-password-focus transition-shadow dark:bg-slate-800 dark:border-slate-700"
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

          {/* Divider - Enhanced with decorative lines */}
          <div className="divider-decorated">
            <span className="text-sky-500 dark:text-sky-400 text-xs font-medium">أو</span>
          </div>

          {/* Google Sign In Button */}
          {googleOAuthAvailable ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-3 btn-press border-sky-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-800"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              تسجيل الدخول باستخدام Google
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-3 opacity-60 cursor-not-allowed border-sky-200 dark:border-slate-700"
                    disabled
                  >
                    <GoogleIcon className="h-5 w-5" />
                    تسجيل الدخول باستخدام Google
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Google OAuth غير مُعد حالياً</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
