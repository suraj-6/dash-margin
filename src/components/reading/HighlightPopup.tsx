import { motion, AnimatePresence } from "framer-motion";
import { PenLine } from "lucide-react";

interface HighlightPopupProps {
  visible: boolean;
  x: number;
  y: number;
  heat: number;
  onAddToMargins: () => void;
}

export function HighlightPopup({ visible, x, y, heat, onAddToMargins }: HighlightPopupProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100] flex flex-col items-center gap-2"
          style={{ left: x, top: y, transform: 'translate(-50%, -100%)', marginTop: '-12px' }}
        >
          {heat > 0 && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E07A5F]/20 shadow-[0_0_20px_rgba(224,122,95,0.3)] flex items-center gap-2"
            >
              <div className="flex gap-1" title="Others found this important too">
                {Array.from({ length: Math.min(heat, 4) }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] opacity-80 animate-pulse" 
                    style={{ animationDelay: `${i * 200}ms` }} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          <button
            onClick={onAddToMargins}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[#1a1a1a] text-white text-sm font-medium
              shadow-xl shadow-black/20
              hover:bg-[#333] active:bg-[#111]
              transition-colors cursor-pointer
            "
          >
            <PenLine size={14} />
            Add to margins
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
