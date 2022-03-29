import styled from "styled-components";
import {ITheme} from "../../general/Theme";
import {Link} from "react-router-dom";

const TitleStyled = styled.div`
    margin-top: 40px;
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily};
    color: ${({theme}: {theme: ITheme}) => theme.collectionView.title.color.quite};
    & >span{
        position: relative;
    }
`;

const LinkStyled = styled(Link)`
    color: black;
    &:hover{
        color: black;
    }
`;

const IconStyled = styled.span`
    position: absolute;
    right: -15px;
    top: -12px;
`;

export {
    TitleStyled,
    LinkStyled,
    IconStyled,
}