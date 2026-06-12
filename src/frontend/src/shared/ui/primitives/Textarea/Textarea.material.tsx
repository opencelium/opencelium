import React from 'react';
import { TextField } from '@mui/material';
import type { TextareaComponent } from './Textarea.types';

export const MaterialTextarea: TextareaComponent = ({
    textareaRef,
    error,
    testId,
    ...props
}) => {
    return (
        <TextField
            {...props}
            multiline
            minRows={3}
            inputRef={textareaRef}
            error={error}
            inputProps={{ 'data-testid': testId }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: 'var(--radius-md)',
                },
                '& textarea': {
                    color: 'var(--color-text-primary)',
                },
            }}
        />
    );
};
