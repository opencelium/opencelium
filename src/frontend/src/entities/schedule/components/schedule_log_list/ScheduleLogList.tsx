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

import ReactDOM from 'react-dom';
import React, {FC, useEffect, useMemo} from 'react';
import {withTheme} from 'styled-components';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {ScheduleLogListProps} from './interfaces';
import {DatetimeValue, MinusStyled, ScheduleLogEntry, ScheduleLogId, ScheduleLogListStyled,} from './styles';
import {useEventListener} from "@application/utils/utils";
import {getFlowChartLogsByExecId} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {DefaultTextSize} from "@entity/application/utils/constants";
function extractDateTime(filename: string): string | null {
    // Match YYYY-MM-DD_HH-MM at start of string
    const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
    if (!match) return null;

    const [ , year, month, day, hour, minute ] = match;

    return `${day}.${month}.${year} ${hour}:${minute}`;
}
const ScheduleLogList: FC<ScheduleLogListProps> =
    ({
        x,
        y,
        isVisible,
        close,
    }) => {
    const dispatch = useAppDispatch();
    const {logList} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const logExecList = useMemo(() => {
        return logList.map((logName) => {
            const splitName = logName.substr(0, logName.length - 4).split('_');
            const executionId = splitName[splitName.length - 1];
            const datetime = extractDateTime(logName);
            return {executionId, datetime};
        }).sort().reverse()
    }, [logList])
    const getLogs = async (executionId: string) => {
        await dispatch(getFlowChartLogsByExecId(executionId));
    }
    const checkIfClickedOutside = (e: any) => {
        const listNode = document.getElementById('schedule_log_list');
        if(listNode){
            if (isVisible && !listNode.contains(e.target)) {
                const inputElement = document.querySelector('[role=dialog]');
                const isPartOfDialog = inputElement ? document.querySelector('[role=dialog]').contains(e.target) : false;
                if(!isPartOfDialog){
                    close();
                }
            }
        }
    }
   useEventListener('mousedown', checkIfClickedOutside, window, isVisible);

    if(!isVisible || x === 0 || y === 0) return null;
    return (
        ReactDOM.createPortal(
            <ScheduleLogListStyled x={x} y={y}>
                {logExecList.length === 0 ?
                    <div style={{textAlign: 'center', width: '100%'}}>
                        {`The list is empty.`}
                    </div>
                    :
                    <table>
                        {logExecList.map(((entry, index) => {
                        return (
                            <ScheduleLogEntry style={{fontSize: `${DefaultTextSize}px`}} key={entry.executionId} onClick={() => getLogs(entry.executionId)}>
                                <td>{`#${entry.executionId}`}</td>
                                <MinusStyled>{`-`}</MinusStyled>
                                <DatetimeValue>{entry.datetime}</DatetimeValue>
                            </ScheduleLogEntry>
                        )}))}
                    </table>
                }
            </ScheduleLogListStyled>,
            document.getElementById('schedule_log_list')
        )
    )
}

ScheduleLogList.defaultProps = {
    isVisible: false,
}


export {
    ScheduleLogList,
};

export default withTheme(ScheduleLogList);
