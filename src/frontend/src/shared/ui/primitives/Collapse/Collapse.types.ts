import type { ReactNode } from 'react';
import React from 'react';

export interface CollapseItem {
    key: string;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
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
