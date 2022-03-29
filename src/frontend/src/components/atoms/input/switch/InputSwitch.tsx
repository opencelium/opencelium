import React, {FC} from 'react';
import {InputSwitchProps} from './interfaces';
import {withTheme} from 'styled-components';
import Input from "../Input";
import {InputSwitcherStyled, InputSwitchStyled} from "./styles";
import Text from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";


const InputSwitch: FC<InputSwitchProps> = ({
       isChecked,
       placeholder,
       required,
       label,
       name,
       onClick,
       icon,
       color,
       error,
       isLoading,
       isIconInside,
       readOnly,
       ...props
    }) => {
    return (
        <Input readOnly={readOnly} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputSwitchStyled {...props}>
                <InputSwitcherStyled isChecked={isChecked} onClick={ readOnly ? () => {} : onClick}/>
                <Text value={name} size={TextSize.Size_14}/>
            </InputSwitchStyled>
        </Input>
    );
}

InputSwitch.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
    position: '',
}

export default withTheme(InputSwitch);