import type { ReactNode } from "react";

type Props = {
  /** Anchor point in chart-local pixels (the hovered data point). */
  x: number;
  y: number;
  /** Chart width, used to flip the box away from the left/right edge. */
  containerWidth: number;
  children: ReactNode;
  testId?: string;
};

const EDGE_RATIO = 0.25;
const GAP = 12;
// Rough box height: above this much headroom the tooltip sits above the point,
// below it flips underneath so it isn't clipped by the card header.
const ESTIMATED_HEIGHT = 84;

const horizontalShift = (x: number, containerWidth: number): string => {
  if (x < containerWidth * EDGE_RATIO) return "0";
  if (x > containerWidth * (1 - EDGE_RATIO)) return "-100%";
  return "-50%";
};

export function ChartTooltip({
  x,
  y,
  containerWidth,
  children,
  testId,
}: Props) {
  const isBelow = y - GAP < ESTIMATED_HEIGHT;

  return (
    <div
      data-testid={testId}
      style={{
        position: "absolute",
        left: x,
        top: isBelow ? y + GAP : y - GAP,
        transform: `translate(${horizontalShift(x, containerWidth)}, ${isBelow ? "0" : "-100%"})`,
        pointerEvents: "none",
        zIndex: 2,
        minWidth: 120,
        padding: "8px 10px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-default)",
        background: "var(--color-background-elevated)",
        boxShadow: "var(--shadow-md)",
        color: "var(--color-text-primary)",
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}
