"use client";

import { useEffect } from "react";

interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const metaPressed = s.meta ? e.metaKey : true;
        const ctrlPressed = s.ctrl ? e.ctrlKey : true;
        const shiftPressed = s.shift ? e.shiftKey : true;
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();

        if (keyMatch && metaPressed && ctrlPressed && shiftPressed) {
          e.preventDefault();
          s.handler(e);
          return;
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [shortcuts]);
}
