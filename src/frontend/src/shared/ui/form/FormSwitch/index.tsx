import { Controller, useFormContext } from 'react-hook-form';
import { Switch } from '@/shared/ui/primitives/Switch';
import React from "react";
import {FormControl} from "@shared/ui/form/FormControl";
import type {SwitchProps} from "@shared/ui/primitives/Switch/Switch.types.ts";
import type {FormControlProps} from "@shared/ui/form/FormControl/FormControl.type.ts";

interface FormSwitchProps extends SwitchProps, Omit<FormControlProps, "children">{
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
    name,
    label,
    labelKey,
    textKey,
    disabled,
    readOnly,
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
                    labelKey={labelKey}
                    error={error}
                >
                    <Switch
                        checked={!!field.value}
                        onChange={field.onChange}
                        disabled={disabled}
                        readOnly={readOnly}
                        textKey={textKey}
                    />
                </FormControl>
            )}
        />
    );
};
