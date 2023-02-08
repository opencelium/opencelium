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

import TooltipButton from "@app_component/base/tooltip_button/TooltipButton";
import Text from "@app_component/base/text/Text";
import styled from "styled-components";

export const MessageStyled = styled.div`
    padding: 2px;
`;

export const LogPanelStyled = styled.div<{isFullScreen: boolean, noLogs: boolean}>`
    min-height: 270px;
    max-height: 270px;
    background: white;
    color: black;
    width: calc(100% - ${({isFullScreen}) => isFullScreen ? '315px' : '300px'});
    white-space: initial;
    overflow-y: auto;
    position: absolute;
    bottom: 0;
    padding: 10px;
    ${({noLogs}) => noLogs ? `
        align-items: center;
        justify-content: center;
        display: flex;
    ` : ''}
`;

const PanelStyled = `
    background: white;
    bottom: 271px;
    min-height: 28px;
    max-height: 28px;
    position: absolute;
    width: 100%;
    height: 28px;
    border-top: 2px solid #eee;
    border-bottom: 1px solid #eee;
    display: flex;
`;

export const HeaderStyled = styled(Text)`
    width: calc(100% - 300px);
    text-align: center;
    color: #555;
`;

export const TopStyled = styled.div<{isLogPanelOpened: boolean}>`
    ${PanelStyled}
    ${({isLogPanelOpened}) => !isLogPanelOpened ? `
    bottom: 0;
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: none;
    & > button{
        position: relative;
    }
    ` : ''}
`;

export const NoLogsStyled = styled(Text)`
    width: 100%;
    height: 100%;
    color: #eee;
    text-align: center;
}
`;

export const HideButtonStyled = styled(TooltipButton)`
    background: white;
    bottom: 0;
    left: 0;
    display: flex;
    position: absolute;
    width: 24px;
    height: 24px;
`;