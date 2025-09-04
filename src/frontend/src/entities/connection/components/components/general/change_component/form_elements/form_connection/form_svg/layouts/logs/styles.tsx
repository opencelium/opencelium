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
import {isNumber} from "lodash";
import {LogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";

export const MessageStyled = styled.div`
    padding: 2px;
`;

export const ResponseMessage = styled.div`
`;

export const LogPanelStyled = styled.div<{isFullScreen: boolean, noLogs: boolean, isDetailsOpened: boolean, logPanelHeight: number | string}>`
    min-height: ${({logPanelHeight}) => isNumber(logPanelHeight) ? `${logPanelHeight}px` : logPanelHeight};
    max-height: ${({logPanelHeight}) => isNumber(logPanelHeight) ? `${logPanelHeight}px` : logPanelHeight};
    background: white;
    color: black;
    width: calc(100% - ${({isFullScreen, isDetailsOpened}) => isFullScreen ? isDetailsOpened ? '315px' : '15px' : isDetailsOpened ? '300px' : '0px'});
    white-space: initial;
    overflow-y: auto;
    position: absolute;
    bottom: 0;
    z-index: 1000;
    display: ${({isDetailsOpened}) => isDetailsOpened ? '10px' : '0'};
    ${({noLogs}) => noLogs ? `
    ` : ''}
`;

export const EmptyLogsStyled = styled.h3`
    color: #ccc;
    text-align: center;
    margin-top: 50px;
`;

export const HeaderStyled = styled(Text)`
    background-color: white;
    user-select: none;
    text-align: center;
    color: #555;
`;

export const TopStyled = styled.div<{logPanelHeight: number | string}>`
    background: white;
    bottom: ${({logPanelHeight}) => logPanelHeight === LogPanelHeight.Full ? 'unset' : `${logPanelHeight}px`};
    top: ${({logPanelHeight}) => logPanelHeight === LogPanelHeight.Full ? 0 : 'unset'};
    min-height: 28px;
    max-height: 28px;
    position: absolute;
    width: 100%;
    height: 28px;
    border-top: 2px solid #eee;
    border-bottom: 1px solid #eee;
    display: flex;
    ${({logPanelHeight}) => !logPanelHeight ? `
    bottom: 0;
    width: 0;
    height: 0;
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
    user-select: none;
    width: 100%;
    height: 100%;
    text-align: center;
    color: #eee;
}
`;

export const ToggleButtonStyled = styled(TooltipButton)`
    background: white;
    bottom: 0;
    left: 2px;
    display: flex;
    position: absolute;
    width: 24px;
    height: 24px;
`;

export const ToggleSmallButtonStyled = styled(TooltipButton)`
    background: white;
`;

export const ToggleSmallButtonContainerStyled = styled.div`
    position: absolute;
    left: 0;
    width: 24px;
    height: 24px;
    display: grid;
    grid-template-columns: 100%;
    &>button{
        justify-content: center;
    }
`;

export const ClearButtonStyled = styled(TooltipButton)`
    background: white;
    bottom: 0;
    display: flex;
    position: absolute;
    width: 24px;
    height: 24px;
`;
export const FullLogsButtonStyled = styled(TooltipButton)`
    background: white;
    bottom: 0;
    display: flex;
    position: absolute;
    width: 24px;
    height: 24px;
`;
