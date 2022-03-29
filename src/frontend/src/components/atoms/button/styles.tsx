import styled from "styled-components";
import chroma from "chroma-js";
import { ButtonStyledProps, LabelStyledProps, SpinnerStyledProps } from "./interfaces";
import {ITheme} from "../../general/Theme";
import {isNumber} from "../../utils";


const ButtonStyled = styled.button<ButtonStyledProps>`
    opacity: ${({isDisabled}) => isDisabled ? 0.5 : 'unset'};
    width: ${({size, iconSize, hasLabel, width}) => width ? width : !hasLabel ? iconSize : 'auto'};
    height: ${({size, iconSize, hasLabel}) => !hasLabel ? iconSize : 'auto'};
    float: ${({float}) => float || 'unset'};
    position: ${({position}) => position || 'unset'};
    right: ${({right}) => right ? `${right}px` : 0};
    bottom: ${({bottom}) => bottom ? `${bottom}px` : 'unset'};
    top: ${({top}) => top || 0};
    border: 1px solid transparent;
    padding: ${({padding}) => padding || '0.375rem .75rem'};
    margin: ${({margin}) => margin || '0'};
    line-height: 1.5;
    border-radius: .25rem;
    transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    align-items: center;
    display: inline-flex;
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.button.color.quite};
    background: ${({background, theme}: {background?: string, theme: ITheme}) => background || theme.button.background.quite};
    border-color: ${({background, theme}: {background?: string, theme: ITheme}) => background || theme.button.background.quite};
    ${({isDisabled, background, color, theme, hasBackground}) => isDisabled ? '' : `
    &:focus, &:focus-visible{
        background: ${hasBackground ? background || theme.button.background.quite : 'unset'};
        box-shadow: 0 0 0 0.2rem ${chroma(hasBackground ? background || theme.button.background.quite : color || theme.button.color.quite).alpha(0.4)};
        outline: none;
    }
    &:hover{
        background: ${chroma(hasBackground ? background || theme.button.background.quite : color || theme.button.color.quite).darken(1.2)};
    }
    &:active{
        background: ${chroma(hasBackground ? background || theme.button.background.quite : color || theme.button.color.quite).darken(1.5)};
    }`};
    ${({hasBackground} : {hasBackground: boolean}) => !hasBackground ? `
        background-color: transparent;
        border: none;
        padding: 0;
        &:hover{
            background-color: transparent !important;
        }
        &:active{
            background-color: transparent !important;
        }
        &:focus{
            background-color: transparent !important;
        }
    ` : ''}
    ${({isContentCentralized}: {isContentCentralized: boolean}) => isContentCentralized ? `
    display: grid;
    place-items: center;
    ` : ''}
`;

const SpinnerStyled = styled.span<SpinnerStyledProps>`
    left: ${({left}) => left || 0};
    top: ${({top}) => top || 0};
    position: ${({position}: {position: string}) => position || 'unset'};
    width: ${({size}) => size ? isNumber(size) ? `${size}px` : size : 'auto'};
    height: ${({size}) => size ? isNumber(size) ? `${size}px` : size : 'auto'};
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.button.color.quite};
    transition: color 0.5s;
    display: grid;
    place-items: center;
    & div{
        width: ${({size}) => size ? isNumber(size) ? `${size}px` : size : '0.7em'};
        height: ${({size}) => size ? isNumber(size) ? `${size}px` : size : '0.7em'};
    }
`;

const LabelStyled = styled.span<LabelStyledProps>`
    margin-left: ${({hasIcon}) => hasIcon ? '5px' : '5'};
    opacity: ${({opacity}: {opacity: number}) => opacity};
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.button.color.quite};
    font-size: ${({size}) => size};
    ${({hasBackground, color}) => !hasBackground ? `
        &:hover{
            text-decoration: underline;
            text-decoration-color: ${color}
        }
    ` : ''}
    @media only screen and (max-width: 1044px){
        display: none;
    }
`;


export {
    ButtonStyled,
    SpinnerStyled,
    LabelStyled,
}