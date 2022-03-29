import styled from "styled-components";
import {GridImageAppearance, GridImageRefreshing} from "../../../styles/animations";
import {ImageStyledProps} from "@molecule/image/interfaces";

const ImageStyled = styled.div<ImageStyledProps>`
    position: relative;
    & img{
        ${({isRefreshing}) => isRefreshing ? GridImageRefreshing : ''}
        width: 80px;
        max-height: 100px;
    }
    float: right;
`;

const UploadButtonStyled = styled.div`
    & button{
        ${GridImageAppearance}
    }
    border-radius: 2px;
    top:0;
    position: absolute;
    width: 80px;
    justify-content: center;
    display: flex;
    height: 100%;
    background-color: rgba(0,0,0,0.2); 
`;


export {
    ImageStyled,
    UploadButtonStyled,
}