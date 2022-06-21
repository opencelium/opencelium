/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {TooltipProps} from "reactstrap";
import {IconProps} from "../icon/interfaces";
import {ButtonProps} from "../button/interfaces";
import {NotificationType} from "@application/interfaces/INotification";
import {Text} from "../text/Text";
import TooltipIcon from "../tooltip_icon/TooltipIcon";
import {TooltipIconProps} from "../tooltip_icon/interfaces";
import {TooltipButtonProps} from "../tooltip_button/interfaces";
import TooltipButton from "../tooltip_button/TooltipButton";

const NotificationStyled = styled.div`
    overflow: hidden;
    position: relative;
`;

const DeleteButtonStyled = styled(TooltipButton)<TooltipButtonProps & ButtonProps & Partial<TooltipProps>>`
    position: absolute;
    right: 2px;
    top: 2px;
`;

const UnFoldIconStyled = styled(TooltipButton)<TooltipButtonProps & ButtonProps & Partial<TooltipProps>>`
    position: absolute;
    right: 21px;
    top: 2px;
`;

const TitleStyled = styled.div`
    padding: 5px;
    color: #012E55;
    font-weight: 600;
`;

const TitleTextStyled = styled(Text)`
    margin-left: 5px;
`;

const MessageStyled = styled.div`
    padding: 0 5px;
    margin-bottom: 30px;
    font-size: 14px;
    overflow: hidden;
    transition: all 0.3s;
    height: ${({isFolded}: {isFolded: boolean}) => isFolded ? '50px' : '150px'};
    minHeight: ${({isFolded}: {isFolded: boolean}) => isFolded ? '50px' : '150px'};
    maxHeight: ${({isFolded}: {isFolded: boolean}) => isFolded ? '50px' : '150px'};
`;

const TransparentGradientStyled = styled.div`
    position: absolute;
    bottom: 25px;
    height: 30px;
    width: 100%;
    background: linear-gradient(
                  180deg
          , rgba(255, 255, 255, 0) -90%, white 100%);
`;

const CreatedTimeStyled = styled(Text)`
    display: block;
    float: right;
    position: absolute;
    bottom: 5px;
    right: 0;
`;

const TypeIconStyled = styled(TooltipIcon)<TooltipIconProps & IconProps & Partial<TooltipProps>>`
    vertical-align: text-top;
    ${({type}) => type === NotificationType.ERROR ? ` 
    color: white;
    background: red;
    border-radius: 50px;
    ` : ''}
    ${({type}) => type === NotificationType.SUCCESS ? `
    color: black;
    ` : ''}
`;

const WarningIconStyled = styled.div`
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 18px solid yellow;
    float: left;
    color: black;
    font-size: 12px;
    text-align: center;
    >div{
        display: inline-block;
        margin-left: -1px;
        margin-top: 1px;
    }
`;

export {
    NotificationStyled,
    DeleteButtonStyled,
    UnFoldIconStyled,
    TitleStyled,
    TitleTextStyled,
    MessageStyled,
    TransparentGradientStyled,
    CreatedTimeStyled,
    WarningIconStyled,
    TypeIconStyled,
}
