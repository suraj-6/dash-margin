import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeatIndicatorProps {
  annotationCount: number;
  onClick?: () => void;
  isActive?: boolean;
}

export const HeatIndicator: React.FC<HeatIndicatorProps> = ({
  annotationCount,
  onClick,
  isActive = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // No annotations - no dot
  if (annotationCount === 0) {
    return null;
  }

  // Color intensity based on annotation count
  const getHeatColor = (count: number): string => {
    if (count <= 2) return 'rgba(224, 122, 95, 0.3)'; // 30% - subtle warm
    if (count <= 5) return 'rgba(224, 122, 95, 0.6)'; // 60% - medium warm
    return 'rgba(224, 122, 95, 1)'; // 100% - full warm
  };

  const heatColor = getHeatColor(annotationCount);
  const size = isActive ? 'w-3 h-3' : 'w-2 h-2';
  const activeSize = isActive ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';

  return (
    <div className="relative flex items-center">
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.3 }}
        whileTap={{ scale: 0.9 }}
        className={`
          ${isActive ? activeSize : size} rounded-full
          transition-all duration-200 cursor-pointer
          ${isActive ? 'ring-2 ring-[#E07A5F]/30' : ''}
        `}
        style={{
          backgroundColor: heatColor,
        }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, x: -8 }}
            animate={{ opacity: 1, y: 0, x: -8 }}
            exit={{ opacity: 0, y: 4, x: -8 }}
            transition={{ duration: 0.15 }}
            className="
              absolute left-full ml-2 px-2 py-1 
              bg-[#1a1a1a] text-white text-xs rounded
              whitespace-nowrap z-50 pointer-events-none
              shadow-lg
            "
          >
            {annotationCount} reader{annotationCount !== 1 ? 's' : ''} engaged here
            <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 w-2 h-2 bg-[#1a1a1a] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation on hover for high-heat paragraphs */}
      {annotationCount >= 6 && (
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: heatColor,
          }}
        />
      )}
    </div>
  );
};

export default HeatIndicator;
