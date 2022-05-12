import styled from "styled-components";
import {ITheme} from "@style/Theme";

const FormSectionIconsStyled = styled.div`
    border-radius: 6px 6px 30px 30px;
    position: absolute;
    top: 0;
    z-index: 100;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    text-align: center;
    clip-path: polygon(0 0, 100% 0, 84% 100%, 16% 100%);
    width: 100px;
    background: ${({theme}: {theme: ITheme}) => theme.button.background.quite || 'rgb(1, 46, 85)'};
    color: white;
    height: 5px;
    transition: all 0.3s;
    &>div:first-child{
        text-align: center;
        margin-top: -14px;
        position: absolute;
        left: 44px;
    }
    &>div:nth-child(2){
        position: relative;
        width: 100px;
        &>span{
            height: 22px;
            button{
                width: 20px;
                &>span{
                    vertical-align: middle;
                }
            }
        }
    }
    &:hover{
        height: 30px;
        &>div:first-child{
            display: none;
        }
    }
`;

export {
    FormSectionIconsStyled,
}