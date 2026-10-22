import { useEffect, useState } from 'react';
import type { ReferencePathFeedback } from './referencePathSyntax';

// antd places a tooltip once, when it opens. An error present on the first
// render of a dialog would open while the dialog still zooms in (~0.3s) and stay
// pinned where the field was mid-animation, so the pin waits for it to settle.
const PIN_DELAY_MS = 400;
const PINNED_MS = 5000;

// A syntax error opens its tooltip without a hover, then falls back to hover
// after a few seconds so it doesn't cover the fields around it. A controlled
// antd tooltip reports no mouse-enter while it is open, so a timer — not a
// hover-out — ends the pinned phase. Warnings stay hover-only.
export function useReferenceFeedbackTooltip(feedback: ReferencePathFeedback | null | undefined) {
  const errorKey = feedback?.severity === 'error' ? feedback.message : null;
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  if (errorKey !== seenKey) {
    setSeenKey(errorKey);
    setPinnedKey(null);
  }

  useEffect(() => {
    if (!seenKey) return;
    const show = setTimeout(() => setPinnedKey(seenKey), PIN_DELAY_MS);
    const hide = setTimeout(() => setPinnedKey(null), PIN_DELAY_MS + PINNED_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [seenKey]);

  return {
    open: !!feedback && (isHovered || (!!errorKey && pinnedKey === errorKey)),
    onOpenChange: setIsHovered,
  };
}
