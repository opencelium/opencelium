import type {ChangeEventHandler, ReactNode} from "react";
import type {InputType} from "@shared/ui/primitives/Input/Input.types.ts";
import type {FormControlProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import type {RegisterOptions} from "react-hook-form";

export interface FormInputProps extends Omit<FormControlProps, "children">{
    rightSlot?: ReactNode;
    readOnly?: boolean;
    type?: InputType;
    autoFocus?: boolean;
    placeholder?: string;
    showCounter?: boolean;
    name?: string,
    value?: string,
    onChange?: ChangeEventHandler<HTMLInputElement>;
    shouldUnregister?: boolean;
    disabled?: boolean;
    rules?: Pick<RegisterOptions, 'required' | 'validate' | 'minLength' | 'maxLength'>;
}
