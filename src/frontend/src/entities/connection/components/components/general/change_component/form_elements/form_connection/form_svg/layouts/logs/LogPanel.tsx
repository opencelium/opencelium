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
    ToggleButtonStyled, LogPanelStyled, NoLogsStyled, TopStyled,
    HeaderStyled, ClearButtonStyled, ToggleSmallButtonStyled, ToggleSmallButtonContainerStyled,
} from "./styles";
import {TextSize} from "@app_component/base/text/interfaces";
import {useAppDispatch} from "@application/utils/store";
import {setLogPanelHeight, clearCurrentLogs, LogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import LogMessage from "@change_component/form_elements/form_connection/form_svg/layouts/logs/LogMessage";

const LogPanel: FC = ({}) => {
    const dispatch = useAppDispatch();
    const {isFullScreen} = Application.getReduxState();
    const {
        currentLogs, logPanelHeight, currentTechnicalItem,
        isTestingConnection, isDetailsOpened,
    } = Connection.getReduxState();
    useEffect(() => {
        if(logPanelHeight) {
            const logPanel = document.getElementById('connection_current_logs');
            if (logPanel) {
                logPanel.scrollTo(0, logPanel.scrollHeight);
            }
        }
    }, [currentLogs])
    useEffect(() => {
        if(logPanelHeight && currentTechnicalItem) {
            const logPanel = document.getElementById('connection_current_logs');
            const itemElement = document.getElementById(`log_panel_${currentTechnicalItem.connectorType}_${currentTechnicalItem.entity.index}`)
            if (logPanel && itemElement) {
                itemElement.scrollIntoView({behavior: 'smooth'});
            }
        }
    }, [currentTechnicalItem])
    return (
        <React.Fragment>
            <TopStyled logPanelHeight={logPanelHeight}>
                {logPanelHeight !== 0 && <HeaderStyled value={'Logs'} width={isDetailsOpened ? 'calc(100% - 300px)' : '100%'}/>}
                {logPanelHeight === LogPanelHeight.High &&
                    <ToggleButtonStyled
                        iconSize={TextSize.Size_20}
                        position={'top'}
                        icon={'expand_more'}
                        tooltip={'Show less'}
                        target={`toggle_log_panel`}
                        hasBackground={false}
                        handleClick={() => dispatch(setLogPanelHeight(LogPanelHeight.Medium))}
                    />
                }
                {logPanelHeight === LogPanelHeight.Medium &&
                    <ToggleSmallButtonContainerStyled>
                        <ToggleSmallButtonStyled
                            iconSize={TextSize.Size_12}
                            position={'top'}
                            icon={'expand_less'}
                            tooltip={'Show More'}
                            target={`toggle_more_log_panel`}
                            hasBackground={false}
                            handleClick={() => dispatch(setLogPanelHeight(LogPanelHeight.High))}
                        />
                        <ToggleSmallButtonStyled
                            iconSize={TextSize.Size_12}
                            position={'bottom'}
                            icon={'expand_more'}
                            tooltip={'Hide'}
                            target={`toggle_less_log_panel`}
                            hasBackground={false}
                            handleClick={() => dispatch(setLogPanelHeight(0))}
                        />
                    </ToggleSmallButtonContainerStyled>
                }
                {logPanelHeight === 0 &&
                    <ToggleButtonStyled
                        iconSize={TextSize.Size_20}
                        position={'right'}
                        icon={'expand_less'}
                        tooltip={'Show Logs'}
                        target={`toggle_log_panel`}
                        hasBackground={false}
                        handleClick={() => dispatch(setLogPanelHeight(LogPanelHeight.Medium))}
                    />
                }
                {logPanelHeight !== 0 && <ClearButtonStyled
                    right={isDetailsOpened ? isFullScreen ? 312 : 300 : isFullScreen ? 12 : 2}
                    iconSize={TextSize.Size_20}
                    position={'right'}
                    isDisabled={currentLogs.length === 0}
                    icon={'delete'}
                    tooltip={'Clear Logs'}
                    target={`clear_log_panel`}
                    hasBackground={false}
                    handleClick={() => dispatch(clearCurrentLogs())}
                />}
            </TopStyled>
            {logPanelHeight !== 0 &&
                <LogPanelStyled id={'connection_current_logs'} isFullScreen={isFullScreen} noLogs={currentLogs.length === 0} isDetailsOpened={isDetailsOpened} logPanelHeight={logPanelHeight}>
                    {currentLogs.length > 0 ?
                        currentLogs.map((log, key) => {
                            const messageProps: React.HTMLAttributes<HTMLDivElement> = {};
                            if(key > 0 && currentLogs[key - 1].index !== log.index){
                                messageProps.id = `log_panel_${log.connectorType}_${log.index}`;
                            }
                            if(log.message === ConnectionLogs.BreakMessage){
                                return <hr key={key}/>;
                            }
                            return (
                                <LogMessage
                                    key={key}
                                    {...messageProps}
                                    style={{background: log?.methodData?.color || '#fff'}}
                                    message={log.message}
                                />
                            );
                        })
                        :
                        <NoLogsStyled isLoading={isTestingConnection} value={"There is no any logs yet"} size={TextSize.Size_30}/>
                    }
                </LogPanelStyled>
            }
        </React.Fragment>
    );
}

export default LogPanel;
