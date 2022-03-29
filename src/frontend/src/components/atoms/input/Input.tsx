import React, {FC} from 'react';
import {InputProps} from './interfaces';
import {ErrorStyled, IconStyled, InputElementStyled, LabelStyled, NumberCounterStyled} from './styles';
import Icon from '../icon/Icon';
import {ColorTheme} from "../../general/Theme";
import {Text} from "../text/Text";
import {TextSize} from "../text/interfaces";


const Input: FC<InputProps> =
    ({
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
    }) => {
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
                    paddingRight: isLoadingWithoutIcon ? '30px' : 0,
                });
            }
            return child;
        });
        if(!minHeight && minHeight !== 0){
            minHeight = 47;
            if(hasLabel){
                minHeight += 20;
            }
        }
        const showIcon = (hasIcon || isLoadingWithoutIcon) && !noIcon;
        return (
            <InputElementStyled className={className} overflow={overflow} height={height} marginTop={marginTop} background={background} ref={componentRef} display={display} minHeight={`${minHeight}px`} paddingTop={paddingTop} paddingBottom={paddingBottom} width={width}>
                {childrenWithProps}
                {hasUnderline && <div/>}
                {showIcon && <IconStyled paddingTop={paddingTop ? paddingTop : '0'} top={hasLabel ? '24px' : '2px'} left={!isLoadingWithoutIcon && isIconInside ? '3px' : '10px'} right={isLoadingWithoutIcon ? isTextarea ? '15px' : '3px' : 'unset'}><Icon color={ColorTheme.LightGray} isLoading={isLoading} name={icon} size={TextSize.Size_24}/></IconStyled>}
                {hasLabel && <LabelStyled labelMargin={labelMargin} paddingTop={paddingTop ? paddingTop : '0'} hasIcon={hasIcon} isIconInside={isIconInside}><Text value={label} size={TextSize.Size_12}/></LabelStyled>}
                {hasError && <ErrorStyled hasIcon={hasIcon} isIconInside={isIconInside}><Text value={error} size={TextSize.Size_12} color={ColorTheme.Red}/></ErrorStyled>}
                {hasMaxLength && <NumberCounterStyled>{`${value ? value.toString().length : 0}/${maxLength}`}</NumberCounterStyled>}
                {afterInputComponent}
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
}

export default Input;