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

import React, {FC, useEffect} from 'react';
import { Connection } from '@entity/connection/classes/Connection';
import { Application } from '@application/classes/Application';
import {
    HideButtonStyled, LogPanelStyled, NoLogsStyled, TopStyled,
    HeaderStyled,
    MessageStyled,
} from "./styles";
import {TextSize} from "@app_component/base/text/interfaces";
import {useAppDispatch} from "@application/utils/store";
import {toggleLogPanel} from "@root/redux_toolkit/slices/ConnectionSlice";

const LogPanel: FC = ({}) => {
    const dispatch = useAppDispatch();
    const {isFullScreen} = Application.getReduxState();
    const {currentLogs, isLogPanelOpened} = Connection.getReduxState();
    useEffect(() => {
        if(isLogPanelOpened) {
            const logPanel = document.getElementById('connection_current_logs');
            if (logPanel) {
                logPanel.scrollTo(0, logPanel.scrollHeight);
            }
        }
    }, [currentLogs, isLogPanelOpened])
    return (
        <React.Fragment>
            <TopStyled isLogPanelOpened={isLogPanelOpened}>
                {isLogPanelOpened && <HeaderStyled value={'Logs'}/>}
                <HideButtonStyled
                    size={TextSize.Size_20}
                    position={'right'}
                    icon={isLogPanelOpened ? 'expand_more' : 'expand_less'}
                    tooltip={isLogPanelOpened ? 'Hide' : 'Show Logs'}
                    target={`toggle_log_panel`}
                    hasBackground={false}
                    handleClick={() => dispatch(toggleLogPanel(!isLogPanelOpened))}
                />
            </TopStyled>
            {isLogPanelOpened &&
                <LogPanelStyled id={'connection_current_logs'} isFullScreen={isFullScreen} noLogs={currentLogs.length === 0}>
                    {currentLogs.length > 0 ? currentLogs.map(log => <MessageStyled style={{background: log.backgroundColor || '#fff'}}>{log.message}</MessageStyled>) :
                    <NoLogsStyled value={"There is no any logs yet"} size={TextSize.Size_30}/>}
                </LogPanelStyled>
            }
        </React.Fragment>
    );
}

export default LogPanel;