import React from 'react';
import { Switch as MuiSwitch, FormControlLabel, CircularProgress } from '@mui/material';
import type { SwitchComponent } from './Switch.types';

export const MaterialSwitch: SwitchComponent = ({
    checked,
    defaultChecked,
    disabled,
    onChange,
    label,
    loading,
    readOnly,
    testId,
}) => {
    const spinner = loading ? <CircularProgress size={12} thickness={5} /> : undefined;
    return (
        <FormControlLabel
            label={label}
            control={
                <MuiSwitch
                    checked={checked}
                    defaultChecked={defaultChecked}
                    disabled={disabled || readOnly || loading}
                    onChange={(_, value) => onChange?.(value)}
                    inputProps={{ 'data-testid': testId } as React.InputHTMLAttributes<HTMLInputElement>}
                    icon={spinner}
                    checkedIcon={spinner}
                    sx={{
                        '& .MuiSwitch-thumb': {
                            backgroundColor: 'var(--color-action-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                    }}
                />
            }
        />
    );
};
