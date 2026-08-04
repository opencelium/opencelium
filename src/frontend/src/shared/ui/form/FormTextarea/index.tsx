
import {Controller, useFormContext} from 'react-hook-form';
import React, { useEffect } from 'react';

import { Textarea } from '@/shared/ui/primitives/Textarea';
import { useFormConstraints } from '@/shared/form/FormConstraintsContext';
import {FormControl} from "@shared/ui/form/FormControl";
import type {TextareaProps} from "@shared/ui/primitives/Textarea/Textarea.types.ts";
import type {FormControlProps} from "@shared/ui/form/FormControl/FormControl.type.ts";

interface FormTextareaProps extends TextareaProps, Omit<FormControlProps, "children">{
    showCounter?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    name,
    label,
    labelKey,
    hint,
    placeholder,
    showCounter,
    readOnly,
    error: externalError,
    testId,
}) => {
    const {
        control,
        formState: { errors },
    } = useFormContext();

    const constraints = useFormConstraints();
    const maxLength = constraints[name]?.maxLength;

    const rhfError = errors[name]?.message as string | undefined;
    const error = externalError ?? rhfError;

    const autoResize = (ref) => {
        const el = ref.current;
        if (!el) return;

        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const value = field.value ?? '';
                const length = value.length;

                const counter =
                    showCounter && maxLength
                        ? `${length}/${maxLength}`
                        : undefined;

                const handleChange = (
                    e: React.ChangeEvent<HTMLTextAreaElement>
                ) => {
                    let nextValue = e.target.value;

                    if (maxLength !== undefined) {
                        nextValue = nextValue.slice(0, maxLength);
                    }

                    field.onChange(nextValue);
                };

                useEffect(() => {
                    autoResize(field.ref);
                }, [value]);

                return (
                    <FormControl
                        label={label}
                        labelKey={labelKey}
                        hint={counter || hint}
                        error={error}
                        testId={testId}
                    >
                        <Textarea
                            value={value}
                            onChange={handleChange}
                            onBlur={field.onBlur}
                            textareaRef={field.ref}
                            placeholder={placeholder}
                            readOnly={readOnly}
                            error={!!error}
                            testId={testId}
                        />
                    </FormControl>
                );
            }}
        />
    );
};
