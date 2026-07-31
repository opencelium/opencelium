import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/shared/ui/primitives/Input';
import React from "react";
import type {FormInputProps} from "@shared/ui/form/FormInput/FormInput.types.ts";
import {FormControl} from "@shared/ui/form/FormControl";
import {useFormConstraints} from "@shared/form/FormConstraintsContext.tsx";

export const FormInput: React.FC<FormInputProps> = ({
    name,
    label,
    labelKey,
    hint,
    placeholder,
    error: externalError,
    showCounter,
    rightSlot,
    type,
    readOnly,
    autoFocus,
    info,
    value,
    onChange,
    shouldUnregister,
    disabled,
    style,
    rules,
    testId,
}) => {
    const {
        control,
        formState,
        getFieldState,
    } = useFormContext();

    const constraints = useFormConstraints();
    const maxLength = constraints[name]?.maxLength;
    const { error: rhfError } = getFieldState(name, formState);
    const error = externalError ?? rhfError?.message;

    return (
        <Controller
            shouldUnregister={shouldUnregister}
            name={name}
            control={control}
            disabled={disabled}
            rules={rules}
            render={({ field }) => {
                const hookValue = field.value ?? '';
                const length = hookValue.length;

                const counter =
                    showCounter && maxLength
                        ? `${length}/${maxLength}`
                        : undefined;
                const handleChange = (
                    e: React.ChangeEvent<HTMLInputElement>
                ) => {
                    let nextValue = e.target.value;

                    if (maxLength !== undefined) {
                        nextValue = nextValue.slice(0, maxLength);
                    }

                    field.onChange(nextValue);
                };
                const inputValue = typeof value === 'undefined' ? hookValue : value;
                const onChangeInput = typeof onChange === 'undefined' ? handleChange : onChange;
                return (
                    <FormControl
                        label={label}
                        labelKey={labelKey}
                        hint={counter || hint}
                        error={error}
                        name={name}
                        info={info}
                        style={style}
                        testId={testId}
                    >
                        <Input
                            type={type}
                            value={inputValue}
                            onChange={onChangeInput}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            placeholder={placeholder}
                            error={!!error}
                            rightSlot={rightSlot}
                            readOnly={readOnly}
                            autoFocus={autoFocus}
                            name={name}
                            disabled={disabled}
                            testId={testId}
                        />
                    </FormControl>
                );
            }}
        />
    );
};
