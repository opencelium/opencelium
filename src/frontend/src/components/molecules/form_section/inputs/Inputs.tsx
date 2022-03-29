import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { InputsProps } from './interfaces';
import { InputsStyled } from './styles';

const Inputs: FC<InputsProps> =
    ({
        height,
        children,
    }) => {
    return (
        <InputsStyled height={height}>
            {children}
        </InputsStyled>
    )
}

Inputs.defaultProps = {
}


export {
    Inputs,
};

export default withTheme(Inputs);