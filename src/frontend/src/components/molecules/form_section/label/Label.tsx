import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {LabelProps} from './interfaces';
import {LabelStyled} from './styles';
import {ColorTheme} from "../../../general/Theme";
import {Text} from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";
/*
* TODO: check everywhere the text (should be lang key)
*/
const Label: FC<LabelProps> =
    ({
        value,
        top,
        left,
        position,
        onClick,
    }) => {
    return (
        <LabelStyled onClick={onClick} background={ColorTheme.Turquoise} top={top} left={left} position={position}>
            <Text value={value} size={TextSize.Size_14} color={ColorTheme.White}/>
        </LabelStyled>
    )
}

Label.defaultProps = {
}


export {
    Label,
};

export default withTheme(Label);