import React from 'react';
import { Checkbox as AntCheckboxBase } from 'antd';
import type { CheckboxComponent } from './Checkbox.types';
import './checkbox.ant.css';

export const AntCheckbox: CheckboxComponent = ({
    checked,
    disabled,
    onChange,
    label,
    testId,
}) => {
    return (
            <AntCheckboxBase
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            data-testid={testId}
            className="ant-checkbox-custom"
        >
            {label}
        </AntCheckboxBase>
    );
};
