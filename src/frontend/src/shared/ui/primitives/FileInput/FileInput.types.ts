import type { ReactNode } from 'react';
import React from "react";

export interface FileInputProps {
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;

    onChange?: (files: File[] | null) => void;

    leftSlot?: ReactNode;
}

export type FileInputComponent = React.FC<FileInputProps>;
