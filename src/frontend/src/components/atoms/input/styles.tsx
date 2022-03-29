import styled, {css} from "styled-components";
import {ITheme} from "../../general/Theme";
import {InputStyledProps, LabelStyledProps, IconStyledProps, ErrorStyledProps, ElementProps} from "./interfaces";

const IconStyled = styled.div<IconStyledProps>`
    position: absolute;
    padding-top: ${({paddingTop}) => paddingTop || 0};
    left: ${({left}) => left || 0};
    right: ${({right}) => right || 'unset'};
    top: ${({top}) => top || '2px'};
    width: 20px;
    height: 20px;
    place-items: center;
    display: grid;
    color: #eee;
`;

const LabelStyled = styled.span<LabelStyledProps>`
    opacity: 1 !important;
    text-transform: capitalize;
    position: absolute;
    left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    padding-top: ${({paddingTop}) => paddingTop || 0};
    top: 0;
    font-size: 12px;
    transition: color 0.5s;
    margin: ${({labelMargin}) => labelMargin || 0};
`;

const ErrorStyled = styled.span<ErrorStyledProps>`
    opacity: 1 !important;
    position: absolute;
    left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    bottom: ${({theme}) => `-${theme.input.inputElement.paddingTop}` || 0};
    font-size: 12px;
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.input.error.color};
    transition: color 0.5s;
`;

const InputElementStyled = styled.div<InputStyledProps | HTMLDivElement>`
    width: ${({width}) => width || 'auto'};
    overflow: ${({overflow}) => overflow || 'unset'};
    position: relative;
    margin-bottom: ${({marginBottom}) => marginBottom || '0'};
    margin-top: ${({marginTop}) => marginTop || '0'};
    height: ${({height}) => height};
    margin-left: ${({marginLeft}) => marginLeft || '0'};
    padding-top: ${({paddingTop}) => paddingTop || '0'};
    padding-bottom: ${({paddingBottom}) => paddingBottom || '0'};
    min-height: ${({minHeight}) => minHeight || 0};
    display: ${({display}) => display || 'block'};
    background: ${({background}) => background || 'unset'};
`;

const NumberCounterStyled = styled.span`
    transition: opacity 0.3s ease-in-out;
    position: absolute;
    right: 0;
    bottom: ${({theme}) => `-${theme.input.inputElement.paddingTop}` || 0};
    font-size: 12px;
    color: #888888;
`;

const EmphasizeInputStyleLines = css`
    & + div{
        opacity: ${({hasNotUnderline}: ElementProps) => hasNotUnderline ? '0 !important' : '1 !important'};
        margin-left: ${({marginLeft, hasIcon, isIconInside, theme}: ElementProps) => marginLeft ? marginLeft : (!hasIcon || isIconInside) ? 0 : theme.input.iconInputDistance};
        height: 2px;
        background: transparent;
        transition: ${({noAnimation}: ElementProps) => noAnimation ? 'unset' : 'color, width 0.5s ease-in-out'}; 
        width: 0;
        margin-top: ${({isTextarea}: ElementProps) => isTextarea ? '-7px' : '-1px'};
    }
    &~span:last-of-type{
        opacity: 0;
    }
    &:hover + div{
        width: ${({hasIcon, isIconInside, width, theme}: ElementProps) => width ? width : (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? `linear-gradient(180deg, rgba(255,255,255,0) 45%, ${emphasizeColor || theme.input.text.color.quite} 100%)` : 'unset'};
    }
    & + div:hover {
        width: ${({hasIcon, isIconInside, width, theme}: ElementProps) => width ? width : (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? `linear-gradient(180deg, rgba(255,255,255,0) 45%, ${emphasizeColor || theme.input.text.color.quite} 100%)` : 'unset'};
    }
    &:focus + div{
        width: ${({hasIcon, isIconInside, width, theme}: ElementProps) => width ? width : (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? `linear-gradient(180deg, rgba(255,255,255,0) 45%, ${emphasizeColor || theme.input.text.color.quite} 100%)` : 'unset'};
    }
    &:focus ~ span{
        color: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? emphasizeColor || theme.input.text.color.quite : 'unset'};
        opacity: 1;
    }
    &:focus ~ div > span{
        color: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? emphasizeColor || theme.input.text.color.quite : 'unset'};
    }
`;

export {
    IconStyled,
    LabelStyled,
    ErrorStyled,
    InputElementStyled,
    NumberCounterStyled,
    EmphasizeInputStyleLines,
}