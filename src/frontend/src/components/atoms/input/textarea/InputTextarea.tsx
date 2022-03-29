import React, {FC} from 'react';
import { InputTextareaProps } from './interfaces';
import {TextareaStyled} from "./styles";
import Input from "../Input";
import {InputTextType} from "../text/interfaces";


const InputTextarea: FC<InputTextareaProps> =
    ({
         maxLength,
         value,
         placeholder,
         required,
         label,
         onChange,
         icon,
         color,
         error,
         isLoading,
         isIconInside,
         rows,
         readOnly,
         ...props
     }) => {
        const hasLabel = label !== '';
        let minHeight = 24 * rows + 23;
        if(hasLabel){
            minHeight += 20;
        }
        return (
            <Input isTextarea readOnly={readOnly} value={value} maxLength={maxLength} placeholder={placeholder} required={required}
                   label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside} minHeight={minHeight}>
                <TextareaStyled
                    isTextarea
                    emphasizeColor={color}
                    maxLength={maxLength}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    readOnly={readOnly}
                    {...props}
                />
            </Input>
        );
    };

InputTextarea.defaultProps = {
    rows: 3,
    maxLength: Infinity,
    type: InputTextType.Text,
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    hasUnderline: true,
}

export default InputTextarea;