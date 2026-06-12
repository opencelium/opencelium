import type { ReactNode } from 'react';
import React from 'react';

export interface SplitterPanelConfig {
    /** Stable identity for the panel; used as the React key. */
    key: string;
    content: ReactNode;
    /** Initial size — number (px) or CSS size string (e.g. '52%'). */
    defaultSize?: number | string;
    /** Minimum size while dragging — number (px) or percentage string. */
    min?: number | string;
    /** Maximum size while dragging — number (px) or percentage string. */
    max?: number | string;
    /** Show a one-click collapse arrow on the adjacent bar. */
    collapsible?: boolean;
}

export interface SplitterProps {
    panels: SplitterPanelConfig[];
    /** Pane orientation; 'horizontal' splits left/right (default), 'vertical' top/bottom. */
    layout?: 'horizontal' | 'vertical';
    /** Fires with the panel sizes (px) when a drag finishes. */
    onResizeEnd?: (sizes: number[]) => void;
    className?: string;
    style?: React.CSSProperties;
}

export type SplitterComponent = React.FC<SplitterProps>;
