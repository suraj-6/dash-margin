import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { AnnotationTypeSelector } from './AnnotationTypeSelector';
import type { AnnotationType } from '@/lib/types';

interface CreateAnnotationFormProps {
  highlightedText: string;
  paragraphIndex: number;
  onSubmit: (data: {
    type: AnnotationType;
    body: string;
    highlightedText: string;
    paragraphIndex: number;
  }) => Promise<void>;
  onCancel: () => void;
}

const MIN_LENGTH = 20;
const MAX_LENGTH = 280;

export const CreateAnnotationForm: React.FC<CreateAnnotationFormProps> = ({
  highlightedText,
  paragraphIndex,
  onSubmit,
  onCancel,
}) => {
  const [type, setType] = useState<AnnotationType>('insight');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const charCount = body.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        body: body.trim(),
        highlightedText,
        paragraphIndex,
      });
      setIsSuccess(true);
      // Close after brief success animation
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error) {
      console.error('Failed to create annotation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E07A5F]/20 flex items-center justify-center"
            >
              <span className="text-3xl">✨</span>
            </motion.div>
            <p className="font-serif text-xl text-[#1a1a1a]">Added to margins</p>
            <p className="text-sm text-[#6B6B6B] mt-1">Your annotation is now visible</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-[#1a1a1a]">Add to margins</h3>
              <button
                onClick={onCancel}
                className="p-1 rounded-full hover:bg-[#F5F5F0] transition-colors"
              >
                <X className="w-5 h-5 text-[#6B6B6B]" />
              </button>
            </div>

            {/* Highlighted Text Preview */}
            <div className="mb-4 p-3 bg-[#FAFAF8] rounded-lg border-l-2 border-[#E07A5F]">
              <p className="text-sm text-[#6B6B6B] italic line-clamp-3">
                "{highlightedText}"
              </p>
            </div>

            {/* Type Selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#6B6B6B] mb-2 uppercase tracking-wide">
                Type
              </label>
              <AnnotationTypeSelector
                selectedType={type}
                onTypeChange={setType}
              />
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="What did this make you think?"
                className="w-full p-3 rounded-lg border-0 border-b-2 border-[#DBD1C1] text-sm resize-none focus:outline-none focus:border-[#E07A5F] transition-colors bg-[#FAFAF8]"
                rows={4}
                autoFocus
              />
              <div className="flex justify-end mt-1">
                <span
                  className={`
                    text-xs transition-colors
                    ${charCount > MAX_LENGTH ? 'text-red-500' : charCount >= MIN_LENGTH ? 'text-[#E07A5F]' : 'text-[#6B6B6B]'}
                  `}
                >
                  {charCount}/{MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F0]">
              <p className="text-xs text-[#6B6B6B]">
                {charCount < MIN_LENGTH
                  ? `Need ${MIN_LENGTH - charCount} more characters`
                  : 'Ready to share'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    flex items-center gap-2
                    transition-all duration-200
                    ${
                      isValid && !isSubmitting
                        ? 'bg-[#E07A5F] text-white hover:bg-[#E07A5F]/90 shadow-md hover:shadow-lg'
                        : 'bg-[#E07A5F]/50 text-white/70 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Add to Margins
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreateAnnotationForm;
