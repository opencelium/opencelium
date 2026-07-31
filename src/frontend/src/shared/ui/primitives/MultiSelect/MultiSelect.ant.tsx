import React from 'react';
import { Select as AntSelect } from 'antd';
import type { MultiSelectComponent } from './MultiSelect.types';
import './multiselect.ant.css';

export const AntMultiSelectImpl: MultiSelectComponent = ({
    value,
    defaultValue,
    disabled,
    options,
    placeholder,
    onChange,
    testId,
}) => {
    return (
        <AntSelect
            mode="multiple"
            data-testid={testId}
            className="ant-select-custom"
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            placeholder={placeholder}
            onChange={onChange}
            options={options.map((opt) => ({
                value: opt.value,
                label: opt.label,
                disabled: opt.disabled,
            }))}
        />
    );
};
