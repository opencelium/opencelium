import React, {FC, useState} from 'react';
import {InputTextProps, InputTextType} from './interfaces';
import {CheckStyled, InputStyled} from "./styles";
import Input from "../Input";


const InputText: FC<InputTextProps> = ({
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
    readOnly,
    type,
    hasUnderline,
    display,
    width,
    marginLeft,
    minHeight,
    background,
    marginTop,
    paddingTop,
    paddingLeftInput,
    paddingRightInput,
    height,
    overflow,
    inputHeight,
    isVisible,
    ...props
}) => {
    if(!isVisible){
        return null;
    }
    const [checked, onCheck] = useState<boolean>(false);
    const changeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        onCheck(!checked);
    }
    const hasCheck = type === InputTextType.Password && !(!icon && isLoading);
    const showPassword = type === InputTextType.Password && checked;
    const hasLabel = label !== '';
    return(
        <Input overflow={overflow} height={height} paddingTop={paddingTop} marginTop={marginTop} background={background} minHeight={minHeight} marginLeft={marginLeft} width={width}
               afterInputComponent={hasCheck ? <CheckStyled paddingTop={paddingTop ? paddingTop : '0'} emphasizeColor={color} marginTop={hasLabel ? '20px' : 0} hasLabel={hasLabel} type={'checkbox'} checked={checked} onChange={changeHandler}/> : null}
               display={display} hasUnderline={hasUnderline} readOnly={readOnly} value={value} maxLength={maxLength} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputStyled
                emphasizeColor={color}
                maxLength={maxLength}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                type={showPassword ? InputTextType.Text : type}
                width={width}
                marginLeft={marginLeft}
                background={background}
                marginTop={marginTop}
                paddingLeftInput={paddingLeftInput}
                paddingRightInput={paddingRightInput}
                height={inputHeight ? inputHeight : height}
                {...props}
            />
        </Input>
    );
}

InputText.defaultProps = {
    maxLength: Infinity,
    type: InputTextType.Text,
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    background: 'unset',
    inputHeight: 'unset',
    isVisible: true,
}

export default InputText;