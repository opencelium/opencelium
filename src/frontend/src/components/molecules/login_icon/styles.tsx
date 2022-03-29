import styled from "styled-components";
import {LoginIconStyledProps} from "@molecule/login_icon/interfaces";

export const LoginIconStyled = styled.div<LoginIconStyledProps>`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 20px;
  img{
    transition: width 0.5s;
    transition-delay: 0.3s;
    width: 3rem;
    cursor: pointer;
    ${({hasRotation}) => hasRotation ? `
        transform-origin: 20px 20px;
        transform: rotate(63deg);
        transition: transform 0.8s;
    ` : ''}
  }
  div{
    margin-top: 5px !important;
    min-height: 1px !important;
  }
  ${({isAuth}) => isAuth ? `
      margin-top: 24px;
      img{
        width: 2.5rem;
      }
  ` : ''}
`;