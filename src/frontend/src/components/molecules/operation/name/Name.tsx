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
import {NameProps} from "@molecule/operation/interfaces";

const Name: FC<NameProps> =
    ({
        ...props
    }) => {
    const [newName, setNewName] = useState(props.operationItem.name || '');
    useEffect(() => {
        setNewName(props.operationItem.name);
    }, [props.operationItem?.name])
    return (
        <InputText
            {...props}
            onChange={(e:ChangeEvent<HTMLInputElement>) => {
                setNewName(e.target.value);
            }}
            onBlur={() => {
                props.operationItem.name = newName;
                props.updateOperation(props.operationItem);
            }}
            value={newName}
        />
    )
}

Name.defaultProps = {
}


export {
    Name,
};