import styled from "styled-components";
import {Link} from "react-router-dom";
import Loading from "@app_component/base/loading/Loading";
import {MenuLinkLogoStyledProps} from "./interfaces";

const LogoImageStyled = styled.img`
    width: 2.5rem;
    height: auto;
    border-radius: 5px;
`;
const LoadingStyled = styled(Loading)`
    width: 2.5rem;
    height: 2.5rem;
    background: none !important;
`;

const MenuLinkLogoStyled = styled(Link)<MenuLinkLogoStyledProps>`
    margin-bottom: 35px !important;
    padding-bottom: 10px;
    &:hover{
        border-bottom: 2px solid ${({theme, $onHoverColor}) => $onHoverColor || theme.menu.menuItem.hover || '#00ACC2'};
        padding-bottom: 8px;
    }
    & > span{
        color: #eee;
        font-weight: 600;
        font-size: 20px;
    }
`;

export {
    LogoImageStyled,
    LoadingStyled,
    MenuLinkLogoStyled,
}