// shared/ui/form/FormFileInput.tsx
import { Controller, useFormContext } from 'react-hook-form';
import { FileInput } from '@/shared/ui/primitives/FileInput';
import React from "react";
import {FormControl} from "@shared/ui/form/FormControl";

interface FormFileInputProps {
    name: string;
    label?: string;
    required?: boolean;
    multiple?: boolean;
    accept?: string;
}

export const FormFileInput: React.FC<FormFileInputProps> = ({
    name,
    label,
    required,
    multiple,
    accept,
}) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    const error = errors[name]?.message as string | undefined;

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControl
                    label={label}
                    error={error}
                    required={required}
                >
                    <FileInput
                        multiple={multiple}
                        accept={accept}
                        onChange={(files) => {
                            field.onChange(
                                multiple ? files : files?.[0] ?? null
                            );
                        }}
                    />
                </FormControl>
            )}
        />
    );
};
