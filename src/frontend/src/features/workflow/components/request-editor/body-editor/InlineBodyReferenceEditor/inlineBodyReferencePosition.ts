import type { BodyReferenceTriggerRect } from './InlineBodyReferenceEditor.types';

let lastTriggerRect: BodyReferenceTriggerRect | null = null;

export const setLastBodyReferenceTriggerRect = (rect: BodyReferenceTriggerRect | null) => {
  lastTriggerRect = rect;
};

export function getInlineBodyReferencePosition() {
  const width = 560;
  const margin = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const rect = lastTriggerRect;

  if (!rect) {
    return { left: Math.max(margin, (viewportWidth - width) / 2), top: 120 };
  }

  const preferredLeft = rect.left + 12;
  const minLeft = Math.max(margin, rect.containerLeft ?? margin);
  const maxLeft = Math.max(minLeft, Math.min(
    viewportWidth - width - margin,
    (rect.containerRight ?? viewportWidth - margin) - width - 8,
  ));

  return {
    left: Math.min(Math.max(minLeft, preferredLeft), maxLeft),
    top: Math.min(
      Math.max(margin, rect.top + rect.height + 6),
      Math.max(margin, viewportHeight - 160),
    ),
  };
}
