'use client';

import React from 'react';

// ============ Circular Progress Component ============
export function CircularProgress({ value, size = 80, strokeWidth = 6, className = '' }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
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
    <svg width={size} height={size} className={`${className} circular-progress-gradient`} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
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
