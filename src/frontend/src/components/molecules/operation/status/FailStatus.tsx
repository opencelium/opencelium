/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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
