import type { ReactNode } from 'react';
import React from "react";

export interface TabItem {
    key: string;
    label: ReactNode;
    content: ReactNode;
    disabled?: boolean;
}

export interface TabsProps {
    items: TabItem[];
    value?: string;
    defaultValue?: string;
    onChange?: (key: string) => void;
    /** Fills the parent's height; the active tab's content gets the space below the tab bar. */
    isFullHeight?: boolean;
}

export type TabsComponent = React.FC<TabsProps>;
