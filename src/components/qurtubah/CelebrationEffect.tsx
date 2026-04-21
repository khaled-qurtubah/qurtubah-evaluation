'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';

// ============ Types ============
interface CelebrationConfig {
  text: string;
  subtext: string;
  icon: string;
  color: string;
}

type CelebrationType = 'overall-milestone' | 'domain-complete';

interface CelebrationEvent {
  type: CelebrationType;
  milestone?: number;
  domainName?: string;
}

// ============ Milestone Configuration ============
const MILESTONE_CONFIG: Record<number, CelebrationConfig> = {
  25: {
    text: 'بداية رائعة!',
    subtext: '25% من التقييم مكتمل',
    icon: '🎯',
    color: '#0ea5e9',
  },
  50: {
    text: 'تقدم رائع!',
    subtext: 'نصف الطريق قد قطعته',
    icon: '⭐',
    color: '#14b8a6',
  },
  75: {
    text: 'شارفت على الانتهاء!',
    subtext: '75% من التقييم مكتمل',
    icon: '🏆',
    color: '#f59e0b',
  },
  100: {
    text: 'تهانينا!',
    subtext: 'تم إنجاز التقييم بالكامل',
    icon: '🎉',
    color: '#10b981',
  },
};

// Domain colors matching the project's domain theme
const DOMAIN_COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#10b981'];

// Confetti particle colors
const CONFETTI_COLORS = [
  '#0ea5e9', // sky
  '#0284c7', // sky-dark
  '#14b8a6', // teal
  '#0d9488', // teal-dark
  '#f59e0b', // amber
  '#d97706', // amber-dark
  '#10b981', // emerald
  '#059669', // emerald-dark
  '#38bdf8', // sky-light
  '#fbbf24', // amber-light
  '#34d399', // emerald-light
  '#2dd4bf', // teal-light
];

// ============ Confetti Particle Component ============
function ConfettiParticle({ index, total }: { index: number; total: number }) {
  // Distribute particles evenly across the viewport width
  const leftPercent = (index / total) * 100;
  const colorIndex = index % CONFETTI_COLORS.length;
  const color = CONFETTI_COLORS[colorIndex];

  // Vary particle properties based on index for visual diversity
  const size = 6 + (index % 5) * 3; // 6px to 18px
  const delay = (index % 8) * 0.15; // 0s to 1.05s
  const duration = 2.5 + (index % 4) * 0.5; // 2.5s to 4s
  const drift = ((index % 7) - 3) * 40; // -120px to 120px horizontal drift
  const rotation = (index % 12) * 30; // 0 to 330 degrees
  const isSquare = index % 3 === 0;
  const isStrip = index % 5 === 0;

  const shapeStyle: React.CSSProperties = isStrip
    ? { width: `${size * 2.5}px`, height: `${size * 0.5}px`, borderRadius: '2px' }
    : isSquare
      ? { width: `${size}px`, height: `${size}px`, borderRadius: '2px' }
      : { width: `${size}px`, height: `${size}px`, borderRadius: '50%' };

  return (
    <div
      className="confetti-particle"
      style={{
        ...shapeStyle,
        '--confetti-left': `${leftPercent}%`,
        '--confetti-drift': `${drift}px`,
        '--confetti-delay': `${delay}s`,
        '--confetti-duration': `${duration}s`,
        '--confetti-rotation': `${rotation}deg`,
        backgroundColor: color,
        left: `${leftPercent}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      } as React.CSSProperties}
    />
  );
}

// ============ Main Celebration Effect Component ============
export function CelebrationEffect({
  isVisible,
  event,
  onDismiss,
}: {
  isVisible: boolean;
  event: CelebrationEvent | null;
  onDismiss: () => void;
}) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Slight delay for the overlay to appear before content
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setShowContent(false), 0);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);

  if (!isVisible || !event) return null;

  const config = event.type === 'overall-milestone' && event.milestone
    ? MILESTONE_CONFIG[event.milestone]
    : event.type === 'domain-complete'
      ? {
          text: 'مجال مكتمل!',
          subtext: event.domainName
            ? `تم إكمال ${event.domainName} بنجاح`
            : 'تم إكمال المجال بنجاح',
          icon: '🏅',
          color: DOMAIN_COLORS[0],
        }
      : MILESTONE_CONFIG[25];

  const particleCount = event.milestone === 100 ? 35 : 25;

  return (
    <div
      className="celebration-overlay"
      onClick={onDismiss}
      role="dialog"
      aria-label={config.text}
    >
      {/* Confetti particles */}
      <div className="confetti-container">
        {Array.from({ length: particleCount }, (_, i) => (
          <ConfettiParticle key={i} index={i} total={particleCount} />
        ))}
      </div>

      {/* Celebration content card */}
      <div className={`celebration-content ${showContent ? 'celebration-content-visible' : ''}`}>
        {/* Achievement badge */}
        <div className="celebration-badge" style={{ '--badge-color': config.color } as React.CSSProperties}>
          <span className="celebration-badge-icon">{config.icon}</span>
        </div>

        {/* Main text */}
        <h2 className="celebration-text">{config.text}</h2>

        {/* Subtext */}
        <p className="celebration-subtext">{config.subtext}</p>

        {/* Progress indicator for 100% */}
        {event.milestone === 100 && (
          <div className="celebration-stars">
            {'★'.repeat(5).split('').map((star, i) => (
              <span key={i} className="celebration-star" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                {star}
              </span>
            ))}
          </div>
        )}

        {/* Dismiss hint */}
        <p className="celebration-dismiss">انقر للإغلاق</p>
      </div>
    </div>
  );
}

// ============ Celebration Manager Hook ============
export function useCelebration(
  overallProgress: number,
  fields: { id: string; name: string; progress: number }[]
) {
  const [celebrationEvent, setCelebrationEvent] = useState<CelebrationEvent | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const STORAGE_KEY = 'qurtubah_celebrated_milestones';

  // Get celebrated milestones from localStorage
  const getCelebrated = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  // Save celebrated milestones to localStorage
  const saveCelebrated = useCallback((celebrated: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...celebrated]));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Check for new milestones when overallProgress changes
  useEffect(() => {
    const celebrated = getCelebrated();
    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      const key = `overall-${milestone}`;
      if (overallProgress >= milestone && !celebrated.has(key)) {
        celebrated.add(key);
        saveCelebrated(celebrated);
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setCelebrationEvent({
            type: 'overall-milestone',
            milestone,
          });
          setIsCelebrating(true);
        }, 0);
        return; // Only trigger one celebration at a time
      }
    }
  }, [overallProgress, getCelebrated, saveCelebrated]);

  // Check for domain completions
  useEffect(() => {
    const celebrated = getCelebrated();

    for (const field of fields) {
      const key = `domain-${field.id}`;
      if (field.progress >= 100 && !celebrated.has(key)) {
        celebrated.add(key);
        saveCelebrated(celebrated);
        // Small delay to avoid simultaneous celebrations
        setTimeout(() => {
          setCelebrationEvent({
            type: 'domain-complete',
            domainName: field.name,
          });
          setIsCelebrating(true);
        }, 500);
        return;
      }
    }
  }, [fields, getCelebrated, saveCelebrated]);

  const dismissCelebration = useCallback(() => {
    setIsCelebrating(false);
    setCelebrationEvent(null);
  }, []);

  // Reset celebrations (useful for testing or new evaluation cycles)
  const resetCelebrations = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return {
    isCelebrating,
    celebrationEvent,
    dismissCelebration,
    resetCelebrations,
  };
}
