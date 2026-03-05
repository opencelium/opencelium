/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useRef} from 'react';
import {ColorTheme} from "@style/Theme";
import {InputProps} from './interfaces';
import {ErrorStyled, IconStyled, InputElementStyled, LabelStyled, NumberCounterStyled} from './styles';
import Icon from '../icon/Icon';
import {Text} from "../text/Text";
import {CheckboxStyled} from "@app_component/base/input/file/styles";
import {isNumber} from "@application/utils/utils";
import {ButtonIconSize, SmallTextSize} from "@entity/application/utils/constants";
import InputHelpIcon from "@app_component/base/input/InputHelpIcon";


const Input: FC<InputProps> =
    ({
        isSelect,
        errorBottom,
        background,
        width,
        paddingTop,
        paddingBottom,
        paddingLeft,
        isTextarea,
        maxLength,
        value,
        placeholder,
        required,
        label,
        icon,
        error,
        isLoading,
        isIconInside,
        minHeight,
        children,
        readOnly,
        hasUnderline,
        noIcon,
        display,
        afterInputComponent,
        marginTop,
        componentRef,
        height,
        overflow,
        className,
        labelMargin,
        paddingRight,
        marginBottom,
        checkboxProps,
        helpMessage,
    }) => {
        const inputRef = useRef(null);
        const hasMaxLength = maxLength !== Infinity && !readOnly;
        const hasLabel = label !== '';
        const hasError = error !== '';
        const hasIcon = !!icon;
        const isLoadingWithoutIcon = !hasIcon && isLoading;
        if(placeholder) placeholder = required ? `${placeholder} *` : placeholder;
        if(hasLabel) label = required ? `${label} *` : label;
        const childrenWithProps = React.Children.map(children, child => {
            if (React.isValidElement(child)) {
                let optionalProps:any;
                if(readOnly){
                    optionalProps = {};
                    optionalProps.tabIndex = '-1';
                }
                return React.cloneElement(child, {
                    ...child.props,
                    ...optionalProps,
                    placeholder,
                    hasIcon,
                    isIconInside,
                    marginTop: hasLabel ? '20px' : 0,
                    paddingLeft: paddingLeft ? paddingLeft : hasIcon && isIconInside ? '50px' : '0',
                    paddingRight: paddingRight ? paddingRight : isLoadingWithoutIcon ? '30px' : 0,
                });
            }
            return child;
        });
        if(!minHeight && minHeight !== 0){
            minHeight = 45;
            if(hasLabel){
                minHeight += 20;
            }
        }
        const showIcon = (hasIcon || isLoadingWithoutIcon) && !noIcon;
        return (
            <InputElementStyled
                marginBottom={marginBottom}
                paddingLeft={paddingLeft}
                paddingRight={paddingRight}
                className={className}
                overflow={overflow}
                height={height}
                marginTop={marginTop}
                background={background}
                ref={componentRef || inputRef}
                display={display}
                minHeight={isNumber(minHeight) ? `${minHeight}px` : minHeight}
                paddingTop={paddingTop}
                paddingBottom={paddingBottom}
                width={width}
            >
                {checkboxProps &&
                    <CheckboxStyled
                        type={'checkbox'}
                        {...checkboxProps}
                    />
                }
                {!!checkboxProps ? <span style={{paddingLeft: '20px'}}>{childrenWithProps}</span> : childrenWithProps}
                {hasUnderline && <div/>}
                {showIcon && <IconStyled paddingTop={paddingTop ? paddingTop : '0'} top={hasLabel ? '24px' : '2px'} left={!isLoadingWithoutIcon && isIconInside ? '3px' : '10px'} right={isLoadingWithoutIcon ? isTextarea ? '15px' : '3px' : 'unset'}><Icon color={ColorTheme.LightGray} isLoading={isLoading} name={icon} size={`${ButtonIconSize}px`}/></IconStyled>}
                {hasLabel && <LabelStyled labelMargin={labelMargin} paddingTop={paddingTop ? paddingTop : '0'} hasIcon={hasIcon} isIconInside={isIconInside}><Text value={label} size={`${SmallTextSize}px`}/></LabelStyled>}
                {hasError && <ErrorStyled errorBottom={errorBottom} paddingLeft={paddingLeft} hasIcon={hasIcon} isIconInside={isIconInside}><Text value={error} size={`${SmallTextSize}px`} color={ColorTheme.Red}/></ErrorStyled>}
                {hasMaxLength && <NumberCounterStyled>{`${value ? value.toString().length : 0}/${maxLength}`}</NumberCounterStyled>}
                {afterInputComponent}
                {!!helpMessage && <InputHelpIcon paddingRight={isSelect ? '20px' : !!afterInputComponent ? '25px' : 0} steps={helpMessage} inputRef={componentRef || inputRef}/>}
            </InputElementStyled>
        );
}

Input.defaultProps = {
    maxLength: Infinity,
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    isIconInside: false,
    hasUnderline: true,
    noIcon: false,
    paddingTop: '0',
    height: 'unset',
    className: '',
    marginBottom: 0,
}

export default Input;
