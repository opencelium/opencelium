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
    /** Rendered at the right end of the tab bar, level with the tabs (e.g. an action for the whole panel). */
    extraContent?: ReactNode;
}

export type TabsComponent = React.FC<TabsProps>;
