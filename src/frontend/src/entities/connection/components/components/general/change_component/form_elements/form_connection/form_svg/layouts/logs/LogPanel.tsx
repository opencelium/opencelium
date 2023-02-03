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
import {LogPanelStyled} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import { Connection } from '@entity/connection/classes/Connection';

const LogPanel: FC = ({}) => {
    const {currentLogs} = Connection.getReduxState();
    useEffect(() => {
        const logPanel = document.getElementById('connection_current_logs');
        if(logPanel){
            logPanel.scrollTo(0, logPanel.scrollHeight);
        }
    }, [currentLogs])
    if(currentLogs.length === 0){
        return null;
    }
    return (
        <LogPanelStyled id={'connection_current_logs'}>
            {currentLogs.map(log => <div>{log.message}</div>)}
        </LogPanelStyled>
    );
}

export default LogPanel;