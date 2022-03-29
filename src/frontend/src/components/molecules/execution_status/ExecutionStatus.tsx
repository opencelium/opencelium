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