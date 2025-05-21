import React, {useState} from 'react';
import Dialog from "@basic_components/Dialog";
import {Schedule} from "@entity/schedule/classes/Schedule";
import {useAppDispatch} from "@application/utils/store";
import {setCurrentExecutionLogs} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";

const ViewLogs = () => {
    const dispatch = useAppDispatch();
    const {currentExecutionLogs} = Schedule.getReduxState();
    const close = () => {
        dispatch(setCurrentExecutionLogs({executionId: '', logs: ''}))
    }
    return (
        <Dialog
            actions={[
                {
                    label: 'Close',
                    onClick: close,
                    id: 'close_view_logs',
                },
            ]}
            active={currentExecutionLogs.logs !== ''}
            toggle={close}
            title={`Logs of the execution #${currentExecutionLogs.executionId}`}
        >
            <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'monospace'}}>
                {currentExecutionLogs.logs}
            </pre>
        </Dialog>
    )
}

export default ViewLogs;
