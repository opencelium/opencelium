import type { ReactNode } from 'react';
import React from "react";

export interface CheckboxProps {
    checked?: boolean;
    disabled?: boolean;

    onChange?: (checked: boolean) => void;

    label?: ReactNode;
    error?: boolean;
}

export type CheckboxComponent = React.FC<CheckboxProps>;
