import type {ReactNode} from "react";
import React from "react";

export interface RadioProps {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
    label?: ReactNode;
    name?: string;
    value?: string;
    /** Stable selector for e2e tests; emitted as `data-testid`. */
    testId?: string;
}

export type RadioComponent = React.FC<RadioProps>;
