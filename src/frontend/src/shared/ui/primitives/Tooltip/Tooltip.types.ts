import React from 'react';
import type { ReactNode } from 'react';

export type TooltipPlacement =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';

export interface TooltipProps {
    content: ReactNode;
    placement?: TooltipPlacement;
    /** Overrides the popup's stacking order — needed when the tooltip is triggered from inside another high-z-index popup (e.g. a Select dropdown) that would otherwise render on top of it. */
    zIndex?: number;
    /** Overrides the popup's default max-width (px) — use for tooltips carrying longer free-text content than the default wrap width comfortably fits. */
    maxWidth?: number;
    children: ReactNode;
}

export type TooltipComponent = React.FC<TooltipProps>;
