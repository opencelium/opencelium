import styled from "styled-components";
import { EmphasizeInputStyleLines } from "../styles";
import {ElementProps} from "../interfaces";
import {ITheme} from "../../../general/Theme";


const TextareaStyled = styled.textarea<ElementProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    resize: none;
    outline: none;
    border: none;
    cursor: ${({readOnly}) => readOnly ? 'default' : 'text'};
    border-bottom: ${({value}) => !value || value.toString().length === 0 ? '1px solid #c1c1c1' : 'none'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    ${EmphasizeInputStyleLines}
`;

export {
    TextareaStyled,
}