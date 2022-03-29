import styled from "styled-components";
import {MaterialIconStyledProps } from "./interfaces";
import {ITheme} from "../../general/Theme";


const MaterialIconStyled = styled.span<MaterialIconStyledProps>`
    transition: color 0.5s;
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.icon.color.quite};
    font-size: ${({size}) => size};
    position: ${({position}) => position || 'unset'};
    left: ${({left}) => left || 'unset'};
    right: ${({right}) => right || 'unset'};
    top: ${({top}) => top || 'unset'};
    ${({styles}) => styles}
`;

export {
    MaterialIconStyled,
}