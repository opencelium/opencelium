import styled from "styled-components";
import {LabelStyledProps} from "./interfaces";

const LabelStyled = styled.span<LabelStyledProps | HTMLSpanElement>`
    text-transform: uppercase;
    font-weight: 600;
    z-index: 100;
    transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding: 15px;
    border-radius: 5px;
    background: ${({background}) => background || 'unset'};
    top: -30px;
    left: 20px;
    position: ${({position}) => position || 'inherit'};
    @media screen and (max-width: 950px) {
         margin-top: -80px;
         top: unset;
         left: unset;
    }
`;

export{
    LabelStyled,
}