import React from 'react';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import type { CheckboxGroupComponent } from './CheckboxGroup.types';

export const BaseCheckboxGroup: CheckboxGroupComponent = ({
    value = [],
    options,
    onChange,
    direction = 'vertical',
}) => {
    const toggle = (optionValue: string, checked: boolean) => {
        if (checked) {
            onChange?.([...value, optionValue]);
        } else {
            onChange?.(value.filter(v => v !== optionValue));
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: direction === 'vertical' ? 'column' : 'row',
                gap: 8,
            }}
        >
            {options.map(option => (
                <Checkbox
                    key={option.value}
                    checked={value.includes(option.value)}
                    disabled={option.disabled}
                    label={option.label}
                    onChange={(checked) => toggle(option.value, checked)}
                />
            ))}
        </div>
    );
};
