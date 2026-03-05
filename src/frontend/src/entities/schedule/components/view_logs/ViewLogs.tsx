import React, {useEffect} from 'react';
import Dialog from "@basic_components/Dialog";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import styles from "./ViewLogs.module.css";
import {setFocusById} from "@application/utils/utils";
import ConnectorPanel from "@app_component/connection_logs/ConnectorPanel/ConnectorPanel";
import {clearSocketLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import DownloadLogs from "@entity/schedule/components/view_logs/DownloadLogs";
const ViewLogs = () => {
    const dispatch = useAppDispatch();
    const {executionId, connectors} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const close = () => {
        dispatch(clearSocketLog())
    }
    useEffect(() => {
        if (connectors.length > 0) {
            setFocusById('close_view_logs', 1000);
        }
    }, [connectors.length]);
    return (
        <Dialog
            actions={[
                {
                    label: 'Close',
                    onClick: close,
                    id: 'close_view_logs',
                    autoFocus: true,
                },
            ]}
            active={connectors.length > 0}
            toggle={close}
            theme={{dialog: styles.modalDialog, body: styles.modalBody}}
            title={`Log of the execution #${executionId}`}
            additionalActions={<DownloadLogs executionId={executionId}/>}
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
