import type { ReactNode } from 'react';
import React from 'react';

export interface CollapseItem {
    key: string;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
    /** When false, hides the arrow and makes the panel static — always open, header not toggleable. */
    showArrow?: boolean;
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
