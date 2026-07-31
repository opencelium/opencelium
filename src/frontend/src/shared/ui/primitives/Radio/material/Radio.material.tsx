import React from "react";
import {Radio as MuiRadio, FormControlLabel} from "@mui/material";
import type {RadioComponent} from "@shared/ui/primitives/Radio/Radio.types.ts";

export const MaterialRadio: RadioComponent = ({
    checked,
    disabled,
    onChange,
    label,
    name,
    value,
    testId,
}) => {
    const control = (
        <MuiRadio
            checked={checked}
            disabled={disabled}
            name={name}
            value={value}
            onChange={(_, value) => onChange?.(value)}
            inputProps={{ 'data-testid': testId } as React.InputHTMLAttributes<HTMLInputElement>}
            sx={{
                color: 'var(--color-action-primary)',
                '&.Mui-checked': {
                    color: 'var(--color-action-primary)',
                },
            }}
        />
    );

    if (label === undefined) {
        return control;
    }
    return <FormControlLabel control={control} label={label} disabled={disabled} />;
};
