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
import {TooltipButton} from "@molecule/tooltip_button/TooltipButton";
import {TooltipButtonProps} from "@molecule/tooltip_button/interfaces";
import {ButtonProps} from "@atom/button/interfaces";
import {TooltipProps} from "reactstrap";

const NotificationPanelStyled = styled.div`
    overflow-y: auto;
    position: fixed;
    top: 0;
    right: ${({isOpened}: {isOpened: boolean}) => isOpened ? '0' : '-300px'};
    height: 100vh;
    width: 300px;
    background: white;
    border-left: 2px solid #ccc;
    transition: all 0.3s;
    z-index: 1001;
    padding: 0 10px;
`;

const CloseButtonStyled = styled(TooltipButton)<TooltipButtonProps & ButtonProps & Partial<TooltipProps>>`
    position: sticky;
    right: 0;
    top: 2px;
    float: right;
    z-index: 1;
    background: white;
    border-radius: 50px;
`;

const PanelTitleStyled = styled.div`
    color: #666;
    margin: 20px 0;
    font-size: 20px;
    font-weight: bold;
    font-family: 'Open Sans', 'Arial', sans-serif;
`;

const ActionsStyled = styled.div`
    position: relative;
    height: 30px;
    font-size: 12px;
    font-family: 'Open Sans', 'Arial', sans-serif;
    color: #00ACC2;
    & > div{
      position: absolute;
      top: 7px;
      right: 0;
      cursor: pointer;
      &:hover{
        text-decoration: underline;
      }
  }
`;

const NotificationsStyled = styled.div`
    & >:nth-child(n){
        border-top: 1px solid #eee;
    }
`;

export {
    NotificationPanelStyled,
    CloseButtonStyled,
    PanelTitleStyled,
    ActionsStyled,
    NotificationsStyled,
}