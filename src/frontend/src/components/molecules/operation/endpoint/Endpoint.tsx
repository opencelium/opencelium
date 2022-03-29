import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import InputText from "@atom/input/text/InputText";
import {EndpointProps} from "@molecule/operation/interfaces";

const Endpoint: FC<EndpointProps> =
    ({
         ...props
     }) => {
        const [newEndpoint, setNewEndpoint] = useState(props.operationItem.request.endpoint || '');
        useEffect(() => {
            setNewEndpoint(props.operationItem.request.endpoint);
        }, [props.operationItem?.request.endpoint])
        return (
            <InputText
                {...props}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    setNewEndpoint(e.target.value);
                }}
                onBlur={() => {
                    props.operationItem.request.endpoint = newEndpoint;
                    props.updateOperation(props.operationItem);
                }}
                value={newEndpoint}
            />
        )
    }

Endpoint.defaultProps = {
}


export {
    Endpoint,
};
