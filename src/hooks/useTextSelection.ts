import { useState, useEffect, useCallback } from "react";

interface TextSelection {
  selectedText: string;
  selectionRect: DOMRect | null;
  paragraphIndex: number | null;
  paragraphId: string | null;
  clearSelection: () => void;
}

export function useTextSelection(): TextSelection {
  const [selectedText, setSelectedText] = useState("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [paragraphIndex, setParagraphIndex] = useState<number | null>(null);
  const [paragraphId, setParagraphId] = useState<string | null>(null);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectedText("");
      setSelectionRect(null);
      setParagraphIndex(null);
      setParagraphId(null);
      return;
    }

    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Find the paragraph that contains the selection
    let node: Node | null = range.commonAncestorContainer;
    
    // If it's a text node, get its parent element
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    // Traverse up to find the paragraph element
    let paragraphElement: HTMLElement | null = null;
    while (node && node instanceof HTMLElement) {
      if (node.dataset.paragraphIndex) {
        paragraphElement = node;
        break;
      }
      node = node.parentElement;
    }

    if (paragraphElement) {
      const indexStr = paragraphElement.dataset.paragraphIndex;
      if (!indexStr) {
        return;
      }
      const index = parseInt(indexStr, 10);
      const id = paragraphElement.dataset.paragraphId || paragraphElement.id;
      
      setSelectedText(text);
      setSelectionRect(rect);
      setParagraphIndex(index);
      setParagraphId(id);
    } else {
      // Selection is outside of tracked paragraphs
      setSelectedText(text);
      setSelectionRect(rect);
      setParagraphIndex(null);
      setParagraphId(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    setSelectedText("");
    setSelectionRect(null);
    setParagraphIndex(null);
    setParagraphId(null);
  }, []);

  useEffect(() => {
    // Handle both mouse and touch events for better compatibility
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(handleSelection, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle keyboard selection (Shift+Arrow keys)
      if (e.shiftKey) {
        setTimeout(handleSelection, 10);
      }
    };

    // Clear selection when clicking outside
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking on annotation controls
      if (!target.closest('[data-annotation-control]')) {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          // User is starting a new selection
          setTimeout(handleSelection, 10);
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleSelection]);

  return {
    selectedText,
    selectionRect,
    paragraphIndex,
    paragraphId,
    clearSelection,
  };
}