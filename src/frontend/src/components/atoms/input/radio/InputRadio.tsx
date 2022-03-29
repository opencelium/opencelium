import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {RadioStyled} from './styles';
import {InputRadioProps, RadiosAlign} from "./interfaces";
import Text from "@atom/text/Text";

const InputRadio: FC<InputRadioProps> =
    ({
        align,
        autoFocus,
        id,
        label,
        checked,
        value,
        onChange,
        color,
        marginLeft,
        currentValue,
        readOnly,
    }) => {
    const inputComponent = <input autoFocus={autoFocus} id={id} readOnly={readOnly} type={'radio'} value={value} checked={value === currentValue} onChange={onChange}/>;
    const inputBeforeLabel = align === RadiosAlign.Horizontal ? inputComponent : null ;
    const inputAfterLabel = align === RadiosAlign.Vertical ? inputComponent : null;
    return (
        <RadioStyled align={align} emphasizeColor={color} marginLeft={marginLeft}>
            {inputBeforeLabel}
            <Text value={label}/>
            {inputAfterLabel}
        </RadioStyled>
    )
}

InputRadio.defaultProps = {
    align: RadiosAlign.Vertical,
}


export {
    InputRadio,
};

export default withTheme(InputRadio);