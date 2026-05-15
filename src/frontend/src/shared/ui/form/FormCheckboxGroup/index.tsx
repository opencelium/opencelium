import { Controller, useFormContext } from 'react-hook-form';
import { CheckboxGroup } from '@/shared/ui/primitives/CheckboxGroup';
import React from "react";
import {FormControl} from "@shared/ui/form/FormControl";

interface FormCheckboxGroupProps {
    name: string;

    label?: string;
    hint?: string;
    required?: boolean;

    options: {
        value: string;
        label: React.ReactNode;
        disabled?: boolean;
    }[];

    direction?: 'vertical' | 'horizontal';
    error?: string;
}

export const FormCheckboxGroup: React.FC<FormCheckboxGroupProps> = ({
    name,
    label,
    hint,
    required,
    options,
    direction,
    error: externalError,
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
                    hint={hint}
                    error={error}
                    required={required}
                >
                    <CheckboxGroup
                        value={field.value ?? []}
                        onChange={field.onChange}
                        options={options}
                        direction={direction}
                        error={!!error}
                    />
                </FormControl>
            )}
        />
    );
};
