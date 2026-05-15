import React from 'react';
import {
    Checkbox as MuiCheckbox,
    FormControlLabel,
} from '@mui/material';
import type { CheckboxComponent } from './Checkbox.types';

export const MaterialCheckbox: CheckboxComponent = ({
    checked,
    disabled,
    onChange,
    label,
}) => {
    return (
        <FormControlLabel
            control={
                <MuiCheckbox
                    checked={checked}
                    disabled={disabled}
                    onChange={(_, value) => onChange?.(value)}
                    sx={{
                        color: 'var(--color-action-primary)',
                        '&.Mui-checked': {
                            color: 'var(--color-action-primary)',
                        },
                    }}
                />
            }
            label={label}
        />
    );
};
