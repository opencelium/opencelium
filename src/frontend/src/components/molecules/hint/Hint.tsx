import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { HintProps } from './interfaces';
import { HintStyled } from './styles';
import Text from "@atom/text/Text";

const Hint: FC<HintProps> =
    ({
        text,
    }) => {
    return (
        <HintStyled>
            <b>{`Hint: `}</b><Text value={text}/>
        </HintStyled>
    )
}

Hint.defaultProps = {
    text: '',
}


export {
    Hint,
};

export default withTheme(Hint);