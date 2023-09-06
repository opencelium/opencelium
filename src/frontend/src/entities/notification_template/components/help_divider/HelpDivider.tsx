import React from 'react';
import {HelpDividerStyled, DividerStyled, TextStyled} from "./styles";

const HelpDivider = ({}) => {
    return (
        <HelpDividerStyled>
            <DividerStyled/>
            <TextStyled>
                {"This search only helps you to find the right argument."}
            </TextStyled>
        </HelpDividerStyled>
    )
}

export default HelpDivider;
