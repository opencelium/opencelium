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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import {ColorTheme} from "@style/Theme";
import {ExecutionStatusProps } from './interfaces';
import {Dialog} from "@app_component/base/dialog/Dialog";

const ExecutionStatus: FC<ExecutionStatusProps> =
    ({
        schedule,
        hasActions,
        onClick,
        readOnly,
    }) => {
        const [lastStatusColor, setLastStatusColor] = useState('');
        const [showCanceledActionMessage, toggleCanceledActionMessage] = useState(false);
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
        const action = () => {
            if(readOnly){
                toggleCanceledActionMessage(true);
            } else{
                onClick();
            }
        }
        return (
            <td key={'status'} style={{background: lastStatusColor}}>
                <InputSwitch readOnly={false} color={ColorTheme.Turquoise} isChecked={!!schedule.status} position={'middle'} onClick={action}/>
                <Dialog
                    actions={[{label: 'Close', onClick: () => toggleCanceledActionMessage(false), id: `show_cancel_action_message_${schedule.id}`}]}
                    active={showCanceledActionMessage}
                    toggle={() => toggleCanceledActionMessage(!showCanceledActionMessage)}
                    title={'Action is canceled'}
                >
                    <span>
                        {'The schedule cannot be enabled, because cron expression is missing.'}
                    </span>
                </Dialog>
            </td>
        );
}

ExecutionStatus.defaultProps = {
    hasActions: true,
    readOnly: false,
}


export {
    ExecutionStatus,
};

export default withTheme(ExecutionStatus);