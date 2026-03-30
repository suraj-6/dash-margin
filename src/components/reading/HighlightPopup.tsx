import { motion, AnimatePresence } from "framer-motion";
import { PenLine } from "lucide-react";

interface HighlightPopupProps {
  visible: boolean;
  x: number;
  y: number;
  onAddToMargins: () => void;
}

export function HighlightPopup({ visible, x, y, onAddToMargins }: HighlightPopupProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[100]"
          style={{ left: x, top: y }}
        >
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
