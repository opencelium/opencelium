import type { ReactNode } from 'react';
import React from "react";

export interface CheckboxProps {
    checked?: boolean;
    disabled?: boolean;

    onChange?: (checked: boolean) => void;

    label?: ReactNode;
    error?: boolean;
    /** Stable selector for e2e tests; emitted as `data-testid` on the input. */
    testId?: string;
}

export type CheckboxComponent = React.FC<CheckboxProps>;
