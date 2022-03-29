import styled from "styled-components";
import {ComponentTitleStyledProps} from "@molecule/component_title/interfaces";

const ComponentTitleStyled = styled.div<ComponentTitleStyledProps>`
    display: block;
    text-align: left;
    margin: 24px 0 26px;
    ${({marginLeft}) => marginLeft ? `margin-left: ${marginLeft};` : ''}
    & >span{
        position: relative;
    }
`;

const IconStyled = styled.span`
    position: absolute;
    right: -15px;
    top: -12px;
`;

export {
    ComponentTitleStyled,
    IconStyled,
}