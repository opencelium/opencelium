/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import styled from "styled-components";
import {SlideToTop} from "../../../styles/animations";
import {CalloutStyledProps, CalloutMessageStyledProps} from "@organism/top_bar/interfaces";
import {ITheme} from "../../general/Theme";

const CalloutStyled = styled.div<CalloutStyledProps>`
    ${SlideToTop}
    z-index: 1000000;
    position: fixed;
    right: 8px;
    top: 34px;
    height: ${({hasFoot}) => hasFoot ? '50px' : 'auto'};
    width: 200px;
    color: black;
    background-color: #fff;
    padding: 10px;
    border-radius: 5px;
    margin: 25px;
    min-height: 50px;
    border: 1px solid ${({hasFoot}) => hasFoot ? '#fff' : '#eee'};
    &:before {
        content: "";
        width: 0px;
        height: 0px;
        border: 0.8em solid transparent;
        position: absolute;
        ${({hasFoot}) => hasFoot ? `
            left: 72.5%;
            top: -20px;
            border-bottom: 10px solid #fff;
        ` : ''} 
    }
   
`;

const CalloutMessageStyled = styled.div<CalloutMessageStyledProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: ${({hasFoot}) => hasFoot ? 'nowrap' : 'normal'};
    display: inline-block;
    width: 86%;
    margin-left: 2%;
    vertical-align: middle;
    margin-top: -4px;
    font-size: 12px;
`;

const TopBarStyled = styled.div`
  z-index: 1000;
  height: 38px;
  position: absolute;
  right: 30px;
  top: 20px;
  display: flex;
  align-items: center;
  >:nth-child(n){
    margin-right: 10px;
  }
  >:first-child,>:last-child{
    margin-right: 0;
  }
  .search_input{
    width: 200px;
    float: left;
    margin-right: 5px;
  }
  .search_icon{
    font-size: 20px;
    border-radius: 50px;
    background: white;
    padding: 4px;
  }
`;

const NotificationAmountStyled = styled.div`
  cursor: pointer;
  text-align: center;
  position: absolute;
  border-radius: 50px;
  background: white;
  font-size: 10px;
  right: -7px;
  padding: 2px;
  font-weight: 700;
  top: -5px;
  width: 20px;
  height: 20px;
`;

const NotificationItemStyled = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
`;

const SingleCalloutStyled = styled.div`
  position: absolute;
  right: 100px;
  top: 10px;
  >div{
    border: 1px solid #eee !important;
    height: auto !important;
    >div{
      text-overflow: unset !important;
      overflow: unset !important;
      white-space: unset !important;
    }
  }
`;

export {
    CalloutStyled,
    CalloutMessageStyled,
    TopBarStyled,
    NotificationAmountStyled,
    NotificationItemStyled,
    SingleCalloutStyled,
}