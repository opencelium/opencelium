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

import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import InputText from "@app_component/base/input/text/InputText";
import {EndpointProps} from "../interfaces";

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
