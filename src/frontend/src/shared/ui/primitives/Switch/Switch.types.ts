import type { ReactNode } from 'react';
import React from "react";

export interface SwitchProps {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Renders an in-progress spinner and blocks interaction. */
    loading?: boolean;

    onChange?: (checked: boolean) => void;

    /** optional label inside switch row */
    text?: {
        on: ReactNode,
        off: ReactNode,
    };
    textKey?: {
        on: ReactNode,
        off: ReactNode,
    };
}

export type SwitchComponent = React.FC<SwitchProps>;
