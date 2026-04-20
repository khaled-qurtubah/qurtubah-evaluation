'use client';

import React, { useState } from 'react';
import { MessageSquare, Plus, X, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EvidenceComment } from './types';

// ============ Comments Parser Helpers ============
// Comments are stored as JSON array string in the Evidence.comments field
// If not JSON, treat as a single legacy comment

export function parseComments(commentsStr: string | null): EvidenceComment[] {
  if (!commentsStr || !commentsStr.trim()) return [];
  try {
    const parsed = JSON.parse(commentsStr);
    if (Array.isArray(parsed)) return parsed;
    // Legacy single comment
    return [{ id: 'legacy', text: String(parsed), author: 'نظام', timestamp: new Date().toISOString() }];
  } catch {
    // Plain text - treat as legacy comment
    return [{ id: 'legacy', text: commentsStr, author: 'نظام', timestamp: new Date().toISOString() }];
  }
}

export function serializeComments(comments: EvidenceComment[]): string {
  return JSON.stringify(comments);
}

// ============ Comment Count Badge ============
export function CommentCountBadge({ comments }: { comments: string | null }) {
  const parsed = parseComments(comments);
  if (parsed.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 shrink-0 cursor-help">
      <MessageSquare className="h-2.5 w-2.5" />
      {parsed.length}
    </span>
  );
}

// ============ Comments Section Component ============
export function CommentsSection({
  comments,
  onCommentsChange,
}: {
  comments: string | null;
  onCommentsChange: (newComments: string) => void;
}) {
  const parsed = parseComments(comments);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: EvidenceComment = {
      id: `c-${Date.now()}`,
      text: newCommentText.trim(),
      author: newCommentAuthor.trim() || 'مستخدم',
      timestamp: new Date().toISOString(),
    };
    const updated = [...parsed, newComment];
    onCommentsChange(serializeComments(updated));
    setNewCommentText('');
    setNewCommentAuthor('');
    setIsAdding(false);
  };

  const handleRemoveComment = (id: string) => {
    const updated = parsed.filter((c) => c.id !== id);
    onCommentsChange(updated.length > 0 ? serializeComments(updated) : '');
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm font-medium text-sky-900 dark:text-sky-100">
            التعليقات ({parsed.length})
          </span>
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-sky-600 dark:text-sky-400"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة تعليق
          </Button>
        )}
      </div>

      {/* Existing Comments */}
      {parsed.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {parsed.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-lg bg-sky-50/80 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 text-sm group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-sky-500" />
                  <span className="text-xs font-medium text-sky-700 dark:text-sky-300">{comment.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-sky-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTime(comment.timestamp)}
                  </span>
                  {comment.id !== 'legacy' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveComment(comment.id)}
                    >
                      <X className="h-3 w-3 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sky-800 dark:text-sky-200 text-xs leading-relaxed">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {isAdding && (
        <div className="p-3 rounded-lg bg-sky-50/50 dark:bg-slate-800/50 border border-sky-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">الاسم:</Label>
            <Input
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
              placeholder="اسمك (اختياري)"
              className="h-7 text-xs"
            />
          </div>
          <Textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="اكتب تعليقك هنا..."
            rows={2}
            className="resize-none text-xs"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => { setIsAdding(false); setNewCommentText(''); setNewCommentAuthor(''); }}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
            >
              <Plus className="h-3 w-3" />
              إضافة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
