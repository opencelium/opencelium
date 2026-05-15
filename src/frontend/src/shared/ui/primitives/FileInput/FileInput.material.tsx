import React from 'react';
import { Button } from '@mui/material';
import type { FileInputComponent } from './FileInput.types';
import { useRef } from 'react';

export const MaterialFileInput: FileInputComponent = ({
    multiple,
    accept,
    disabled,
    onChange,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = e.target.files;
        onChange?.(files ? Array.from(files) : null);
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple={multiple}
                accept={accept}
                disabled={disabled}
                onChange={handleChange}
            />

            <Button
                variant="contained"
                onClick={handleClick}
                disabled={disabled}
            >
                Upload file
            </Button>
        </>
    );
};
