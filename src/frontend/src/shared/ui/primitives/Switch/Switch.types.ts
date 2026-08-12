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
    /** Where the label (text/textKey) renders relative to the switch knob.
     * Defaults to 'right'. */
    textPosition?: 'left' | 'right';
    /** Stable selector for e2e tests; emitted as `data-testid`. */
    testId?: string;
}

export type SwitchComponent = React.FC<SwitchProps>;
