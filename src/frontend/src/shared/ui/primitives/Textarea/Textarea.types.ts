import type { Ref, ChangeEventHandler } from 'react';
import React from "react";

export interface TextareaProps {
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    readOnly?: boolean;

    onChange?: ChangeEventHandler<HTMLTextAreaElement>;
    onBlur?: () => void;

    textareaRef?: Ref<HTMLTextAreaElement>;
}

export type TextareaComponent = React.FC<TextareaProps>;
