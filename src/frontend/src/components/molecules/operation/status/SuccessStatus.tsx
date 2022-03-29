import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import InputText from "@atom/input/text/InputText";
import {StatusProps} from "@molecule/operation/interfaces";

const SuccessStatus: FC<StatusProps> =
    ({
         ...props
     }) => {
        const [newSuccessStatus, setNewSuccessStatus] = useState(props.operationItem.response.success.status || '');
        useEffect(() => {
            setNewSuccessStatus(props.operationItem.response.success.status);
        }, [props.operationItem?.response.success.status])
        return (
            <InputText
                {...props}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setNewSuccessStatus(e.target.value);
                }}
                onBlur={() => {
                    props.operationItem.response.success.status = newSuccessStatus;
                    props.updateOperation(props.operationItem);
                }}
                value={newSuccessStatus}
            />
        )
    }

SuccessStatus.defaultProps = {
}


export {
    SuccessStatus,
};
