import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { MultiSelect } from '@/shared/ui/primitives/MultiSelect';
import type { MultiSelectOption } from '@/shared/ui/primitives/MultiSelect/MultiSelect.types';
import {FormControl} from "@shared/ui/form/FormControl";

interface FormMultiSelectProps<T = string> {
    name: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    options: MultiSelectOption<T>[];
}

export function FormMultiSelect<T>({
    name,
    label,
    required,
    placeholder,
    options,
}: FormMultiSelectProps<T>) {
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
                    required={required}
                    error={error}
                >
                    <MultiSelect
                        value={field.value ?? []}
                        onChange={field.onChange}
                        options={options}
                        placeholder={placeholder}
                    />
                </FormControl>
            )}
        />
    );
}
