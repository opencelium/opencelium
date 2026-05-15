import React from 'react';
import { Button } from 'antd';
import type { FileInputComponent } from './FileInput.types';
import { useRef } from 'react';

export const AntFileInput: FileInputComponent = ({
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

            <Button onClick={handleClick} disabled={disabled}>
                Upload file
            </Button>
        </>
    );
};
