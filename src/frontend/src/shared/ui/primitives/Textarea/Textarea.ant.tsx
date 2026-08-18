import React from 'react';
import { Input } from 'antd';
import type { TextareaComponent } from './Textarea.types';
import './textarea.ant.css';

export const AntTextarea: TextareaComponent = ({
    textareaRef,
    error,
    disabled,
    readOnly,
    testId,
    ...props
}) => {
    return (
        <Input.TextArea
            {...props}
            data-testid={testId}
            rows={4}
            ref={(node) => {
                const textarea = node?.resizableTextArea?.textArea ?? null;

                if (typeof textareaRef === 'function') {
                    textareaRef(textarea);
                } else if (textareaRef) {
                    textareaRef.current = textarea;
                }
            }}
            status={error ? 'error' : undefined}
            className="ant-textarea-custom"
            disabled={disabled || readOnly}
        />
    );
};
