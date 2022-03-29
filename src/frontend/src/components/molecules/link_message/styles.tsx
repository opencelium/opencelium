import styled from "styled-components";
import {LinkMessageStyledProps} from "@molecule/link_message/interfaces";

const LinkMessageStyled = styled.span<LinkMessageStyledProps>`
    font-weight: 600;
    ${({notClickable}) => notClickable ? '' : `
        color: #00ACC2;
        cursor: pointer;
        &:hover{
        text-decoration: underline;
        }
    `}    
`;

export {
    LinkMessageStyled,
}