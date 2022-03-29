import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import InputText from "@atom/input/text/InputText";
import {StatusProps} from "@molecule/operation/interfaces";

const FailStatus: FC<StatusProps> =
    ({
         ...props
     }) => {
        const [newFailStatus, setNewFailStatus] = useState(props.operationItem.response.fail.status || '');
        useEffect(() => {
            setNewFailStatus(props.operationItem.response.fail.status);
        }, [props.operationItem?.response.fail.status])
        return (
            <InputText
                {...props}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setNewFailStatus(e.target.value);
                }}
                onBlur={() => {
                    props.operationItem.response.fail.status = newFailStatus;
                    props.updateOperation(props.operationItem);
                }}
                value={newFailStatus}
            />
        )
    }

FailStatus.defaultProps = {
}


export {
    FailStatus,
};
