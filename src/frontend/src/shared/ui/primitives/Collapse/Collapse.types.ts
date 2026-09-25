import type { ReactNode } from 'react';
import React from 'react';

export interface CollapseItem {
    key: string;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
    /** When false, hides the arrow and makes the panel static — always open, header not toggleable. */
    showArrow?: boolean;
    /**
     * Identifies the panel's header, so a test or a tour can target the control that
     * opens it. Ant has no header slot of its own, so it lands on the label inside the
     * header; Material puts it on the whole summary row.
     */
    testId?: string;
}

export interface CollapseProps {
    items: CollapseItem[];
    activeKeys?: string[];
    defaultActiveKeys?: string[];
    accordion?: boolean;
    onChange?: (keys: string[]) => void;
    className?: string;
    style?: React.CSSProperties;
}

export type CollapseComponent = React.FC<CollapseProps>;
