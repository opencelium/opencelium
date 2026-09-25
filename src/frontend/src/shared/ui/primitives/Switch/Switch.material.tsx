import React from 'react';
import { Switch as MuiSwitch, FormControlLabel, CircularProgress } from '@mui/material';
import type { SwitchComponent } from './Switch.types';
import { EntityText } from '@shared/ui/primitives/Text';

export const MaterialSwitch: SwitchComponent = ({
    checked,
    defaultChecked,
    disabled,
    onChange,
    text,
    textKey,
    textPosition = 'right',
    loading,
    readOnly,
    testId,
}) => {
    const spinner = loading ? <CircularProgress size={12} thickness={5} /> : undefined;
    const label = textKey
        ? <EntityText isBold i18nKey={checked ? textKey.on : textKey.off}/>
        : text
            ? (checked ? text.on : text.off)
            : undefined;
    return (
        <FormControlLabel
            label={label}
            labelPlacement={textPosition === 'left' ? 'start' : 'end'}
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
