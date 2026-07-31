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
}

export type TabsComponent = React.FC<TabsProps>;
