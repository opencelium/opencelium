import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { OptionProps } from './interfaces';
import { OptionStyled } from './styles';

const Option: FC<OptionProps> =
    ({
        ...props
    }) => {
    return (
        <OptionStyled readOnly={true} {...props}/>
    )
}

Option.defaultProps = {
    isCurrent: false,
}


export {
    Option,
};

export default withTheme(Option);