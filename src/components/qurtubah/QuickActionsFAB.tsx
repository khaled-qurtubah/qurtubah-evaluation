'use client';

import React, { useState } from 'react';
import {
  Plus, FileText, StickyNote, Camera, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============ Quick Actions FAB Component ============
export function QuickActionsFAB({
  onAddEvidence,
  onAddNote,
  onTakePhoto,
}: {
  onAddEvidence?: () => void;
  onAddNote?: () => void;
  onTakePhoto?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: FileText,
      label: 'إضافة شاهد',
      onClick: () => {
        onAddEvidence?.();
        setIsOpen(false);
      },
      color: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      icon: StickyNote,
      label: 'إضافة ملاحظة',
      onClick: () => {
        onAddNote?.();
        setIsOpen(false);
      },
      color: 'bg-amber-500 hover:bg-amber-600',
    },
    {
      icon: Camera,
      label: 'التقاط صورة',
      onClick: () => {
        onTakePhoto?.();
        setIsOpen(false);
      },
      color: 'bg-teal-500 hover:bg-teal-600',
    },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40 md:hidden" dir="rtl">
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action items */}
      <div
        className={`absolute bottom-16 left-0 space-y-3 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, idx) => {
          const IconComp = action.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 flex-row-reverse"
              style={{
                transitionDelay: isOpen ? `${idx * 50}ms` : `${(actions.length - idx) * 50}ms`,
              }}
            >
              <button
                className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95`}
                onClick={action.onClick}
              >
                <IconComp className="h-5 w-5" />
              </button>
              <span className="text-xs font-medium bg-white dark:bg-slate-800 text-sky-900 dark:text-sky-100 px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap">
                {action.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main FAB button */}
      <button
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-slate-700 dark:bg-slate-600 rotate-45'
            : 'bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700'
        } text-white active:scale-95`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
