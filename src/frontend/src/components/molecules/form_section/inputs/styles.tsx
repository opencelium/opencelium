import styled from "styled-components";
import {InputsStyledProps} from "./interfaces";

const InputsStyled = styled.div<InputsStyledProps>`
    transition: height 0.3s;
    height: ${({height}) => height || 'auto'};
    &>:not(:last-child){
        margin-bottom: 5px;
    }
`

export {
    InputsStyled,
}