import { useEffect, useRef } from "react";
import { JsonStringView } from "./logRowUi";
import { useMethodDetailViewState } from "./methodDetailViewState";

const DEFAULT_HEIGHT = 180;
const MIN_HEIGHT = 80;

// A vertically resizable JSON viewer. Its height is persisted (keyed by
// `storageKey`) so it survives method rows remounting between loop iterations.
export function ResizableJsonView({
  storageKey,
  value,
}: {
  storageKey: string;
  value: string;
}) {
  const { heights, setHeight } = useMethodDetailViewState();
  const ref = useRef<HTMLDivElement>(null);
  const height = heights[storageKey] ?? DEFAULT_HEIGHT;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // border-box height matches the applied inline height, so writing it back
    // is a no-op until the user actually drags the resize handle.
    const observer = new ResizeObserver(() =>
      setHeight(storageKey, el.offsetHeight),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [storageKey, setHeight]);

  return (
    <div
      ref={ref}
      style={{
        height,
        minHeight: MIN_HEIGHT,
        boxSizing: "border-box",
        resize: "vertical",
        overflow: "auto",
        border: "1px solid var(--color-border-default)",
        borderRadius: 6,
      }}
    >
      <JsonStringView value={value} bare />
    </div>
  );
}
