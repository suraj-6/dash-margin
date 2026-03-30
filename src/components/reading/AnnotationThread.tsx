import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User } from 'lucide-react';
import { MarginAnnotation } from './MarginAnnotation';
import type { Annotation, AnnotationReply } from '@/lib/types';

interface AnnotationThreadProps {
  annotation: Annotation;
}

export const AnnotationThread: React.FC<AnnotationThreadProps> = ({
  annotation,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<AnnotationReply[]>(annotation.replies || []);
  const REPLY_LIMIT = 5;

  const handleSubmitReply = () => {
    if (replyText.trim().length < 10) return;
    
    const newReply: AnnotationReply = {
      id: `reply-${Date.now()}`,
      userId: 'current-user',
      userName: 'You',
      body: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    
    setReplies([...replies, newReply]);
    setReplyText('');
    setIsReplying(false);
  };

  const remainingReplies = REPLY_LIMIT - replies.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Original Annotation */}
      <div className="p-4 border-b border-[#F5F5F0]">
        <MarginAnnotation annotation={annotation} isExpanded />
      </div>

      {/* Thread Line & Replies */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-[#E07A5F]/20" />

        <AnimatePresence>
          {replies.map((reply, index) => (
            <motion.div
              key={reply.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative p-4 pl-12"
            >
              {/* Thread dot */}
              <div className="absolute left-4 top-5 w-3 h-3 rounded-full bg-[#E07A5F]/40 border-2 border-white" />
              
              <div className="bg-[#FAFAF8] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#457B9D]/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-[#457B9D]" />
                  </div>
                  <span className="text-xs font-medium text-[#1a1a1a]">{reply.userName}</span>
                </div>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">{reply.body}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-[#F5F5F0]">
        {isReplying ? (
          <div className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add to the conversation..."
              className="w-full p-3 rounded-lg border border-[#DBD1C1] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B6B6B]">
                {remainingReplies} {remainingReplies === 1 ? 'reply' : 'replies'} remaining
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1.5 text-sm text-[#6B6B6B] hover:text-[#1a1a1a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={replyText.trim().length < 10}
                  className="px-3 py-1.5 text-sm bg-[#E07A5F] text-white rounded-lg hover:bg-[#E07A5F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        ) : remainingReplies > 0 ? (
          <button
            onClick={() => setIsReplying(true)}
            className="text-sm text-[#457B9D] hover:text-[#457B9D]/80 transition-colors"
          >
            Add a reply...
          </button>
        ) : (
          <p className="text-xs text-[#6B6B6B]">Thread limit reached</p>
        )}
      </div>
    </motion.div>
  );
};

export default AnnotationThread;
