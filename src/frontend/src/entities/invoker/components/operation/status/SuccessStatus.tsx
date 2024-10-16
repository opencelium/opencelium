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
import {StatusProps} from "../interfaces";

const SuccessStatus: FC<StatusProps> =
    ({
        index,
         ...props
     }) => {
        const [newSuccessStatus, setNewSuccessStatus] = useState(props.operationItem.response.success.status || '');
        useEffect(() => {
            setNewSuccessStatus(props.operationItem.response.success.status);
        }, [props.operationItem?.response.success.status])
        return (
            <InputText
                {...props}
                id={`operation_item_success_status_${index}`}
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
