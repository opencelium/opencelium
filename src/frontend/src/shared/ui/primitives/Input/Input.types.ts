import React from "react";
import type { ChangeEventHandler, CSSProperties, KeyboardEventHandler, ReactNode, Ref } from 'react';

export type InputVariant = 'default' | 'outlined' | 'filled';

export type InputType = 'text' | 'password' | 'number';

export interface InputProps {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    maxLength?: number;
    readOnly?: boolean;
    autoFocus?: boolean;

    variant?: InputVariant;

    onChange?: ChangeEventHandler<HTMLInputElement>;
    onBlur?: () => void;
    onFocus?: () => void;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement>;

    leftSlot?: ReactNode;
    rightSlot?: ReactNode;
    type?: InputType;
    name?: string;
    className?: string;
    style?: CSSProperties;
    inputRef?: Ref<HTMLInputElement>;
}

export type InputComponent = React.FC<InputProps>;
