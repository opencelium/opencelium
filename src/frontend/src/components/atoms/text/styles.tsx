import styled from "styled-components";
import {ITheme} from "../../general/Theme";
import {TextStyledProps} from './interfaces';

const TextStyled = styled.span<TextStyledProps>`
    color: ${({color, theme}:{color:string, theme: ITheme}) => color || 'inherit'};
    font-size: ${({size, theme}:{size:string, theme: ITheme}) => size || theme.text.size || '16px'};
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    padding-left: ${({paddingLeft}) => paddingLeft || '0'};
    width: ${({width}) => width || 'unset'};
    display: ${({display}) => display || 'unset'};
    border-bottom: ${({borderBottom}) => borderBottom || 'none'};
    font-weight: ${({isBold}) => isBold ? '600' : 'unset'};
`;

export {
    TextStyled,
}