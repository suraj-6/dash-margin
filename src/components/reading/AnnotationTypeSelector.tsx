import React from 'react';
import type { AnnotationType } from '@/lib/types';

interface AnnotationTypeSelectorProps {
  selectedType: AnnotationType;
  onTypeChange: (type: AnnotationType) => void;
}

const annotationTypes: { type: AnnotationType; icon: string; label: string }[] = [
  { type: 'insight', icon: '💡', label: 'Insight' },
  { type: 'question', icon: '❓', label: 'Question' },
  { type: 'challenge', icon: '⚔️', label: 'Challenge' },
  { type: 'connection', icon: '🔗', label: 'Connection' },
];

export const AnnotationTypeSelector: React.FC<AnnotationTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  return (
    <div className="flex gap-2">
      {annotationTypes.map(({ type, icon, label }) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedType === type
                ? 'bg-[#E07A5F] text-white shadow-sm'
                : 'bg-transparent border border-[#DBD1C1] text-[#6B6B6B] hover:border-[#E07A5F]/50 hover:text-[#E07A5F]'
            }
          `}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default AnnotationTypeSelector;
