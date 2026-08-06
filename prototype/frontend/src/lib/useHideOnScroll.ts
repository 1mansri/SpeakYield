"use client";

import { RefObject, useEffect, useState } from "react";

interface ScrollState {
  hidden: boolean;
  /** Which surface the reading was taken on. */
  key: unknown;
}

/**
 * True while the farmer is scrolling *down* through a scroll container — the signal for
 * chrome to get out of the way and give the content the whole screen.
 *
 * Deliberately hysteretic: it ignores movements under `threshold` so a thumb resting on
 * the glass doesn't flap the tab bar, and it always reads false at the top and bottom of
 * the list, where a bar that stayed hidden would strand the farmer with no way back to
 * the other tabs.
 *
 * The reading is stamped with `resetKey` rather than cleared when the key changes, so a
 * tab switch reads as "not hidden" the instant it happens — no effect, no extra render
 * pass with the previous surface's chrome state still showing.
 */
export function useHideOnScroll(
  ref: RefObject<HTMLElement | null>,
  /** Changing this (e.g. on tab switch) brings the chrome straight back. */
  resetKey?: unknown,
  threshold = 10,
): boolean {
  const [state, setState] = useState<ScrollState>({ hidden: false, key: resetKey });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let last = el.scrollTop;
    let frame = 0;

    const onScroll = () => {
      // Scroll fires far faster than the screen repaints; one read per frame is enough
      // and keeps this off the critical path on a low-end phone.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = el.scrollTop;
        const delta = y - last;
        if (Math.abs(delta) < threshold) return;

        const atTop = y < 24;
        const atBottom = y + el.clientHeight >= el.scrollHeight - 8;
        setState({ hidden: !atTop && !atBottom && delta > 0, key: resetKey });
        last = y;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, resetKey, threshold]);

  return state.key === resetKey && state.hidden;
}
