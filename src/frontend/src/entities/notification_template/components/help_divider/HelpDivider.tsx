import React from 'react';
import {HelpDividerStyled, DividerStyled, TextStyled} from "./styles";

const HelpDivider = ({}) => {
    return (
        <HelpDividerStyled>
            <DividerStyled/>
            <TextStyled>
                {"This search only helps you too find the right argument."}
            </TextStyled>
        </HelpDividerStyled>
    )
}

export default HelpDivider;
