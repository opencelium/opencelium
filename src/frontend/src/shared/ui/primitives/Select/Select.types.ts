import type {ReactNode, Ref} from 'react';
import React from "react";

export interface SelectOption<T = string> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
}

export interface AsyncOptionsConfig {
    url: string;
    map: (data: any) => { value: string | number; label: string; disabled?: boolean }[];
    refreshable?: boolean;
}

export interface SelectProps<T = string> {
    value?: T;
    defaultValue?: T;
    disabled?: boolean;
    autoFocus?: boolean;

    options: SelectOption<T>[];

    placeholder?: string;

    onChange?: (value: T) => void;
    readOnly?: boolean;
    multiple?: boolean,
    asyncOptions?: AsyncOptionsConfig,
    creatable?: boolean;
    createOptionUrl?: string;
    isLoading?: boolean;
    selectRef?: Ref<HTMLInputElement>;
    onRefresh?: () => void;
    onCreate?: (value: string) => Promise<{
        label: string;
        value: string;
    }> | {
        label: string;
        value: string;
    };
}

export type SelectComponent<T = string> = React.FC<SelectProps<T>>;
