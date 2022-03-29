import styled from "styled-components";
import {EmphasizeInputStyleLines} from "../styles";
import {CheckStyledProps, ElementProps} from "../interfaces";
import {ITheme} from "../../../general/Theme";
import chroma from "chroma-js";

const InputStyled = styled.input<ElementProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    background: ${({background}) => background ? background : 'unset'};
    outline: none;
    border: none;
    cursor: ${({readOnly}) => readOnly ? 'default' : 'text'};
    border-bottom: ${({value}) => !value || value.toString().length === 0 ? '1px solid #c1c1c1' : 'none'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft, paddingLeftInput}) => paddingLeftInput ? paddingLeftInput : paddingLeft || 0};
    padding-right: ${({paddingRight, paddingRightInput}) => paddingRightInput ? paddingRightInput : paddingRight || 0};
    padding-top: ${({paddingTop, theme}) => paddingTop || theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width ? width : isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({marginLeft, hasIcon, isIconInside, theme}) => marginLeft ? marginLeft : !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    height: ${({height}) => height || 'auto'};
    ${EmphasizeInputStyleLines}
`;

const CheckStyled = styled.input<CheckStyledProps | ElementProps>`
    position: absolute;
    right: 6px;
    top: 7px;
    margin-top: ${({marginTop, paddingTop}) => marginTop || paddingTop || 0};
    &:focus, &:focus-within{
        background: ${({emphasizeColor, theme}: {emphasizeColor?: string, theme: ITheme}) => emphasizeColor || theme.button.background.quite};
        box-shadow: 0 0 0 0.2rem ${({emphasizeColor, color, theme, hasBackground}: {emphasizeColor?: string, color?: string, theme: ITheme, hasBackground: boolean}) => `${chroma(emphasizeColor || theme.button.background.quite).alpha(0.4)}`};
        outline: none;
    }
`;

export {
    InputStyled,
    CheckStyled,
}