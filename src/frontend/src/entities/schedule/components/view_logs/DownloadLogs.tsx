import React, {useEffect, useState} from 'react';
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {useAppDispatch} from "@application/utils/store";
import {getLogsByExecutionId} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {Schedule} from "@entity/schedule/classes/Schedule";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const DownloadLogs = ({executionId}: {executionId: string }) => {
    const dispatch = useAppDispatch();
    const {gettingLogsByExecutionId} = Schedule.getReduxState();
    const [startScheduling, setStartScheduling] = useState<boolean>(false);
    const download = () => {
        setStartScheduling(true);
        dispatch(getLogsByExecutionId(executionId));
    }
    useEffect(() => {
        if (gettingLogsByExecutionId === API_REQUEST_STATE.FINISH || gettingLogsByExecutionId === API_REQUEST_STATE.ERROR) {
            setStartScheduling(false);
        }
    }, [gettingLogsByExecutionId])
    return (
        <TooltipButton
            isLoading={startScheduling}
            position={"bottom"}
            icon={"file_download"}
            tooltip={"Download"}
            target={`download_logs`}
            hasBackground={false}
            handleClick={download}
        />
    )
}

export default DownloadLogs;
