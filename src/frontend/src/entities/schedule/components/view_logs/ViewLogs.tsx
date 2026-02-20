import React, {useEffect, useMemo, useRef, useState} from 'react';
import Dialog from "@basic_components/Dialog";
import {Schedule} from "@entity/schedule/classes/Schedule";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {copyLogsToClipboard, setCurrentExecutionLogs} from "@entity/schedule/redux_toolkit/slices/ScheduleSlice";
import styles from "./ViewLogs.module.css";
import InputText from "@app_component/base/input/text/InputText";
import {debounce} from "lodash";
import {copyStringToClipboard, timeout} from "@application/utils/utils";
import {EmptyLogsStyled} from "@change_component/form_elements/form_connection/form_svg/layouts/logs/styles";
import ConnectorPanel from "@app_component/connection_logs/ConnectorPanel/ConnectorPanel";
import {clearSocketLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
const ViewLogs = () => {
    const dispatch = useAppDispatch();
    const {executionId, connectors} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const close = () => {
        dispatch(clearSocketLog())
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
            active={connectors.length > 0}
            toggle={close}
            theme={{dialog: styles.modalDialog, body: styles.modalBody}}
            title={`Log of the execution #${executionId}`}
            hasFullScreenOption
        >
            {
                connectors.map((connector) => (
                    <ConnectorPanel
                        key={connector.flowId}
                        connector={connector}
                        executionId={executionId}
                    />
                ))}
        </Dialog>
    )
}

export default ViewLogs;
