import {Radio as MuiRadio, FormControlLabel} from "@mui/material";
import type {RadioComponent} from "@shared/ui/primitives/Radio/Radio.types.ts";

export const MaterialRadio: RadioComponent = ({
    checked,
    disabled,
    onChange,
    label,
    name,
    value,
}) => {
    const control = (
        <MuiRadio
            checked={checked}
            disabled={disabled}
            name={name}
            value={value}
            onChange={(_, value) => onChange?.(value)}
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
