import { TextField, InputAdornment } from '@mui/material';
import type { InputComponent } from './Input.types';

export const MaterialInput: InputComponent = ({
    variant = 'outlined',
    leftSlot,
    rightSlot,
    error,
    inputRef,
    disabled,
    readOnly,
    type,
  ...rest
}) => {
    return (
        <TextField
            {...rest}
            disabled={disabled || readOnly}
            inputRef={inputRef}
            error={error}
            type={type}
            fullWidth={true}
            variant={variant === 'filled' ? 'filled' : 'outlined'}
            InputProps={{
                startAdornment: leftSlot && (
                    <InputAdornment position="start">
                        {leftSlot}
                        </InputAdornment>
                ),
                    endAdornment: rightSlot && (
                    <InputAdornment position="end">
                        {rightSlot}
                        </InputAdornment>
                ),
            }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-md)',
                },
                '& input': {
                    color: 'var(--color-text-primary)',
                },
            }}
        />
    );
};
