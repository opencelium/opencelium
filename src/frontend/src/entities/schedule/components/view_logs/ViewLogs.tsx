import React, {useState} from 'react';
import {ViewLogsProps} from "@entity/schedule/components/view_logs/interfaces";
import Dialog from "@basic_components/Dialog";

const ViewLogs = ({logs, executionId}: ViewLogsProps) => {
    const [isVisible, toggleVisible] = useState<boolean>(false);
    return (
        <Dialog
            actions={[
                {
                    label: 'Close',
                    onClick: () => toggleVisible(false),
                    id: 'close_view_logs',
                },
            ]}
            active={isVisible}
            toggle={() => toggleVisible(!isVisible)}
            title={`Logs of the execution #${executionId}`}
        >
            
        </Dialog>
    )
}

export default ViewLogs;
