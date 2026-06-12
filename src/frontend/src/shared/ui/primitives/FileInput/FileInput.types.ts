import type { ReactNode } from 'react';
import React from "react";

export interface FileInputProps {
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;

    onChange?: (files: File[] | null) => void;

    leftSlot?: ReactNode;
    /** Stable selector for e2e tests; emitted as `data-testid` on the file input. */
    testId?: string;
}

export type FileInputComponent = React.FC<FileInputProps>;
