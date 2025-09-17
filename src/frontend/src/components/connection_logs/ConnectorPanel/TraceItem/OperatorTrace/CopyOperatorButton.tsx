import React, {useState} from 'react';
import {TextSize} from "@app_component/base/text/interfaces";
import {ConnectionLogRequest} from "@root/requests/classes/ConnectionLogRequest";
import {copyStringToClipboard} from "@application/utils/utils";
import {copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import Button from "@app_component/base/button/Button";
import {OperatorTraceProps} from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/OperatorTrace";
import {useAppDispatch} from "@application/utils/store";

const CopyOperatorButton = ({flowId, executionId, iterationIndexes, trace, iterationIndex}: OperatorTraceProps & {iterationIndex: number}) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    return (
        <Button
            iconSize={TextSize.Size_12}
            icon={'file_copy'}
            hasBackground={false}
            isLoading={isLoading}
            handleClick={async (e) => {
                e?.stopPropagation();
                setIsLoading(true);
                const logRequest = new ConnectionLogRequest();
                const response = await logRequest.getDetailedOperator({
                    flowId,
                    indexPath: trace.indexPath,
                    loopIndex: [...iterationIndexes, iterationIndex],
                    id: trace.id,
                    executionId,
                });
                copyStringToClipboard(JSON.stringify(response.data.segment));
                dispatch(copyLogContentToClipboard())
                setIsLoading(false);
            }}
            style={{
                marginLeft: '5px'
            }}
        />
    )
}

export default CopyOperatorButton;
