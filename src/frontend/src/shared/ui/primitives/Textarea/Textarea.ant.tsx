import React from 'react';
import { Input } from 'antd';
import type { TextareaComponent } from './Textarea.types';
import './textarea.ant.css';

export const AntTextarea: TextareaComponent = ({
    textareaRef,
    error,
    ...props
}) => {
    return (
        <Input.TextArea
            {...props}
            rows={4}
            ref={textareaRef}
            status={error ? 'error' : undefined}
            className="ant-textarea-custom"
        />
    );
};
