import type {ReactNode, Ref} from 'react';
import React from "react";

export interface MultiSelectOption<T = string> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
}

export interface MultiSelectProps<T = string> {
    value?: T[];
    defaultValue?: T[];
    disabled?: boolean;

    options: MultiSelectOption<T>[];

    placeholder?: string;

    onChange?: (values: T[]) => void;

    inputRef?: Ref<HTMLInputElement>;
}

export type MultiSelectComponent<T = string> =
    React.FC<MultiSelectProps<T>>;
