import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from '@/shared/ui/primitives/Checkbox';
import React from "react";
import {FormControl} from "@shared/ui/form/FormControl";

interface FormCheckboxProps {
    name: string;
    text?: string;
    label?: string;
    required?: boolean;
    error?: string;
    testId?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
    name,
    label,
    required,
    error: externalError,
    text,
    testId,
}) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    const rhfError = errors[name]?.message as string | undefined;
    const error = externalError ?? rhfError;

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControl
                    label={label}
                    error={error}
                    required={required}
                    testId={testId}
                >
                    <Checkbox
                        checked={!!field.value}
                        onChange={field.onChange}
                        label={text}
                        error={!!error}
                        testId={testId}
                    />
                </FormControl>
            )}
        />
    );
};
