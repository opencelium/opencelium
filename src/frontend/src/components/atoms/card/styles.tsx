import styled from "styled-components";
import { CardProps } from "./interfaces";

const CardStyled = styled.div<CardProps>`
    ${({isButton}) => isButton ? `
      &:hover {
        box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.12), 1px 3px 15px rgba(0, 0, 0, 0.24);
      }
      cursor: pointer;
    ` : ''}
    height: ${({isVisible}) => isVisible ? 'auto' : 0};
    overflow: ${({overflow, isVisible}) => overflow ? overflow : isVisible ? 'unset' : 'hidden'};
    display: ${({isVisible}) => isVisible ? 'block' : 'none'};
    background: #ffffff;
    padding: ${({padding, isVisible}) => isVisible ? padding || 0 : 0};
    margin: ${({margin, isVisible}) => isVisible ? margin || 0 : 0};
    transition: opacity 0.4s;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 12%), 0 1px 2px rgb(0 0 0 / 24%);
    position: relative;
    ${({isRefreshing}) => isRefreshing ? 'opacity: 0;' : 'opacity: 1;'}
    ${({isListCard, gridViewType}) => isListCard ? `
        display: flex;
        flex-direction: column;
        margin-bottom: 20px;
        min-height: 150px;
        width: auto;
        padding: 10px;
        & > div:first-child{
        }
        & > div:nth-child(2){
            color: #797979;
        }
        ${gridViewType === 5 ? `
            width: 19%;
            margin-right: 1.25%;
            &:nth-child(5n){
              margin-right: 0;
            }
        ` : ''}
        ${gridViewType === 4 ? `
            width: 24%;
            margin-right: 1.33%;
            &:nth-child(4n){
              margin-right: 0;
            }
        ` : ''}
        ${gridViewType === 3 ? `
            width: 32.5%;
            margin-right: 1.25%;
            &:nth-child(3n){
              margin-right: 0;
            }
        ` : ''}
        ${gridViewType === 2 ? `
            width: 49%;
            margin-right: 2%;
            &:nth-child(2n){
              margin-right: 0;
            }
        ` : ``}
    ` : ``}
`;

export {
    CardStyled,
}