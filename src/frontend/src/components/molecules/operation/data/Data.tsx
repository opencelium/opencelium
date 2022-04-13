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

import React, {FC} from 'react';
import {StatusProps} from "@molecule/operation/interfaces";
import InputRadios from "@atom/input/radio/InputRadios";
import {DataType} from "@model/invoker/Body";

const Data: FC<StatusProps> =
    ({
        value,
        onChange,
        readOnly,
        ...props
    }) => {
        return (
            <InputRadios
                value={value}
                onChange={onChange}
                label={'Data'}
                icon={'save'}
                options={[{label: 'Raw', value: DataType.Raw, key: DataType.Raw}, {label: 'GraphQL', value: DataType.GraphQL, key: DataType.GraphQL}]}
                readOnly={readOnly}
            />

        )
    }

Data.defaultProps = {
}


export {
    Data,
};
