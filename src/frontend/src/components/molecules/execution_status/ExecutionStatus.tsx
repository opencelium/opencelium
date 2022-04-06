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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {ExecutionStatusProps } from './interfaces';
import InputSwitch from "@atom/input/switch/InputSwitch";
import {ColorTheme} from "../../general/Theme";

const ExecutionStatus: FC<ExecutionStatusProps> =
    ({
        schedule,
        hasActions,
        onClick,
    }) => {
        const [lastStatusColor, setLastStatusColor] = useState('');
        useEffect(() => {
            const lastExecutionFailTime = schedule.lastExecution?.fail?.startTime || 0;
            const lastExecutionSuccessTime = schedule.lastExecution?.success?.startTime || 0;
            let newLastStatusColor = lastExecutionFailTime > lastExecutionSuccessTime ? '#f5c3c3' : '#c3f5c3';
            if (lastExecutionSuccessTime === 0 && lastExecutionFailTime === 0) {
                newLastStatusColor = 'unset';
            }
            if (!schedule.status) {
                newLastStatusColor = '#cccccc';
            }
            setLastStatusColor(newLastStatusColor);
        }, [schedule?.lastExecution, schedule.status])
        if(!hasActions){
            let status = schedule.status ? 'on' : 'off';
            return <td key={'status'} title={status}>{status}</td>;
        }
        return (
            <td key={'status'} style={{background: lastStatusColor}}>
                <InputSwitch color={ColorTheme.Turquoise} isChecked={!!schedule.status} position={'middle'} onClick={onClick}/>
            </td>
        );
}

ExecutionStatus.defaultProps = {
    hasActions: true,
}


export {
    ExecutionStatus,
};

export default withTheme(ExecutionStatus);