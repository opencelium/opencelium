import type {ReactNode, Ref} from 'react';
import React from "react";

export interface SelectOption<T = string> {
    value: T;
    label: ReactNode;
    disabled?: boolean;
    /** Plain-text used for search filtering and sorting when `label` is a ReactNode. */
    searchLabel?: string;
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
    // Defaults to true: options are sorted alphabetically by label. Set false to
    // render options in the order provided.
    sortOptions?: boolean,
    asyncOptions?: AsyncOptionsConfig,
    creatable?: boolean;
    createOptionUrl?: string;
    isLoading?: boolean;
    selectRef?: Ref<HTMLInputElement>;
    onRefresh?: () => void;
    /** Stable selector for e2e tests; emitted as `data-testid`. */
    testId?: string;
    onCreate?: (value: string) => Promise<{
        label: string;
        value: string;
    }> | {
        label: string;
        value: string;
    };
}

export type SelectComponent<T = string> = React.FC<SelectProps<T>>;
