import React from 'react';
import {
    Select as MuiSelect,
    MenuItem,
    Checkbox,
    ListItemText,
    FormControl as MuiFormControl,
    InputLabel,
} from '@mui/material';
import type { MultiSelectComponent } from './MultiSelect.types';

export const MaterialMultiSelect: MultiSelectComponent = ({
    value = [],
    defaultValue,
    disabled,
    options,
    placeholder,
    onChange,
}) => {
    return (
        <MuiFormControl fullWidth>
            {placeholder && <InputLabel>{placeholder}</InputLabel>}

            <MuiSelect
                multiple
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                label={placeholder}
                onChange={(e) => onChange?.(e.target.value as any[])}
                renderValue={(selected) =>
                    options
                        .filter((o) => (selected as any[]).includes(o.value))
                        .map((o) => o.label)
                        .join(', ')
                }
                sx={{
                    borderRadius: 'var(--radius-md)',
                }}
            >
                {options.map((opt) => (
                    <MenuItem
                        key={String(opt.value)}
                        value={opt.value}
                        disabled={opt.disabled}
                    >
                        <Checkbox checked={value.includes(opt.value)} />
                        <ListItemText primary={opt.label} />
                    </MenuItem>
                ))}
            </MuiSelect>
        </MuiFormControl>
    );
};
