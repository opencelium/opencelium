import React from 'react';
import { Checkbox as AntCheckboxBase } from 'antd';
import type { CheckboxComponent } from './Checkbox.types';
import './checkbox.ant.css';

export const AntCheckbox: CheckboxComponent = ({
    checked,
    disabled,
    onChange,
    label,
}) => {
    return (
            <AntCheckboxBase
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.checked)}
            className="ant-checkbox-custom"
        >
            {label}
        </AntCheckboxBase>
    );
};
