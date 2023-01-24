/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import styled from "styled-components";
import {LoginIconStyledProps} from "./interfaces";

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