import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import type { Annotation, AnnotationType } from '@/lib/types';

interface MarginAnnotationProps {
  annotation: Annotation;
  isExpanded?: boolean;
  onClick?: () => void;
}

// Type emoji mapping
const typeEmojis: Record<AnnotationType, string> = {
  insight: '💡',
  question: '❓',
  challenge: '⚔️',
  connection: '🔗',
};

const typeLabels: Record<AnnotationType, string> = {
  insight: 'Insight',
  question: 'Question',
  challenge: 'Challenge',
  connection: 'Connection',
};

// Relative time formatter
const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const MarginAnnotation: React.FC<MarginAnnotationProps> = ({
  annotation,
  isExpanded = false,
  onClick,
}) => {
  const {
    userName,
    userInstitution,
    body,
    type,
    replyCount,
    createdAt,
  } = annotation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        group relative p-3 rounded-lg cursor-pointer
        transition-all duration-200
        ${isExpanded ? 'bg-white shadow-md ring-1 ring-accent/20' : 'bg-white/60 hover:bg-white hover:shadow-md'}
      `}
      style={{
        borderLeft: '3px solid #E07A5F',
      }}
    >
      {/* Header: Avatar + Name + Institution */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#E07A5F]/20 flex items-center justify-center text-xs font-medium text-[#1a1a1a]">
          {getInitials(userName || 'Anonymous')}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-[#1a1a1a]">{userName || 'Anonymous'}</span>
          {userInstitution && (
            <>
              <span className="text-[#6B6B6B]">•</span>
              <span className="text-[#6B6B6B] text-xs">{userInstitution}</span>
            </>
          )}
        </div>
      </div>

      {/* Type Badge */}
      <div className="mb-2">
        <span
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
            ${isExpanded ? 'bg-[#E07A5F] text-white' : 'bg-[#E07A5F]/10 text-[#E07A5F]'}
          `}
        >
          <span>{typeEmojis[type] || '💡'}</span>
          <span>{typeLabels[type] || 'Insight'}</span>
        </span>
      </div>

      {/* Annotation Text */}
      <p className="text-sm text-[#1a1a1a] leading-relaxed mb-2">
        {body}
      </p>

      {/* Footer: Replies + Time */}
      <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
        <button className="flex items-center gap-1 hover:text-[#E07A5F] transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{replyCount || 0} {replyCount === 1 ? 'reply' : 'replies'}</span>
        </button>
        <span>{formatRelativeTime(createdAt)}</span>
      </div>

      {/* Expand indicator */}
      {!isExpanded && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4 text-[#6B6B6B]" />
        </div>
      )}
    </motion.div>
  );
};

export default MarginAnnotation;
