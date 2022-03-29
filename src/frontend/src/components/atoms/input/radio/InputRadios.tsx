import React, {FC} from 'react';
import {InputRadiosProps, RadiosAlign} from './interfaces';
import {InputRadio} from "./InputRadio";
import {withTheme} from 'styled-components';
import Input from "../Input";
import {InputRadiosStyled} from "./styles";


const InputRadios: FC<InputRadiosProps> = ({
        autoFocus,
        options,
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
        readOnly,
        align,
        ...props
    }) => {
    const hasOptions = options && options.length > 0;
    if(!hasOptions){
        return null;
    }
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputRadiosStyled readOnly={readOnly} {...props}>
                {
                    options.map((option, key) =>
                        <InputRadio align={align} autoFocus={option.autoFocus} key={option.key} id={`input_${option.label.toString().toLowerCase()}`} readOnly={readOnly} {...option} onChange={readOnly ? () => {} : onChange} currentValue={value}/>
                    )
                }
            </InputRadiosStyled>
        </Input>
    );
}

InputRadios.defaultProps = {
    align: RadiosAlign.Vertical,
    label: '',
    error: '',
    required: false,
    isLoading: false,
}

export default withTheme(InputRadios);