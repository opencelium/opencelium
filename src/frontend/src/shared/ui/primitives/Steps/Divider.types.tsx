import React from "react";


export interface StepsProps {
    current: number,
    /**
     * Force the narrow-viewport rail — horizontal, headers only — regardless of
     * viewport. For hosts that are themselves narrow, e.g. a docked side panel.
     */
    compact?: boolean,
    status?: 'wait' | 'process' | 'finish' | 'error',
    items: {
        header: React.ReactNode,
        subheader?: React.ReactNode,
        content?: React.ReactNode,
        status?: 'wait' | 'process' | 'finish' | 'error';
        onClick?: () => void | Promise<void>;
    }[]
}

export type StepsComponent = React.FC<StepsProps>;
