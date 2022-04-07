/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useState} from 'react';
import {InputTextProps, InputTextType} from './interfaces';
import {CheckStyled, InputStyled} from "./styles";
import Input from "../Input";
import {ColorTheme} from "../../../general/Theme";


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
    paddingLeft,
    paddingRight,
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
        <Input overflow={overflow} height={height} paddingTop={paddingTop} marginTop={marginTop} background={background} minHeight={minHeight} marginLeft={marginLeft} width={width} paddingLeft={paddingLeft} paddingRight={paddingRight}
               afterInputComponent={hasCheck ? <CheckStyled hasBackground={false} icon={checked ? 'visibility_off' : 'visibility'} paddingRight={paddingRight} paddingTop={paddingTop ? paddingTop : '0'} color={ColorTheme.Blue} marginTop={hasLabel ? '20px' : 0} handleClick={changeHandler}/> : null}
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
                paddingRightInput={hasCheck ? `calc(${paddingRightInput || '0px'} + 30px)` : paddingRightInput || '0'}
                height={inputHeight ? inputHeight : height}
                paddingRight={paddingRight}
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