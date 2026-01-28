import styled from "styled-components";
import {ITheme} from "@style/Theme";
import chroma from "chroma-js";
import {
    DropdownToggle,
    DropdownItem,
} from 'reactstrap';

export const DropdownToggleStyled = styled(DropdownToggle)<any>`
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.button.color.quite};
    background: ${({background, theme}: {background?: string, theme: ITheme}) => theme.button.background.quite};
    border-color: ${({background, theme}: {background?: string, theme: ITheme}) => theme.button.background.quite};
    ${({theme}) => `
    &:focus, &:focus-visible{
        background: ${theme.button.background.quite} !important;
        box-shadow: 0 0 0 0.2rem ${chroma(theme.button.background.quite).alpha(0.4)} !important;
        outline: none;
    }
    &:hover{
        background: ${chroma(theme.button.background.quite).darken(1.2)} !important;
    }
    &:active{
        background: ${chroma(theme.button.background.quite).darken(1.5)} !important;
        box-shadow: 0 0 0 0.2rem ${chroma(theme.button.background.quite).alpha(0.4)} !important;
    }`};
`;
export const DropdownItemStyled = styled(DropdownItem)<any>`
    ${({theme}) => `
    &:focus, &:focus-visible{
        background: ${theme.button.background.quite} !important;
        box-shadow: 0 0 0 0.2rem ${chroma(theme.button.background.quite).alpha(0.4)} !important;
        outline: none;
    }
    &:active{
        background: ${chroma(theme.button.background.quite).alpha(1.5)} !important;
        box-shadow: 0 0 0 0.2rem ${chroma(theme.button.background.quite).alpha(0.4)} !important;
    }`};
`;
