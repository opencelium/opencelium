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

import React, {FC} from 'react';
import InputRadios from "@app_component/base/input/radio/InputRadios";
import {StatusProps} from "../interfaces";
import {DataType} from "../../../requests/models/Body";

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
                options={[{id: `operation_item_data_raw_${props.index}`,label: 'Raw', value: DataType.Raw, key: DataType.Raw}, {id: `operation_item_data_graphql_${props.index}`,label: 'GraphQL', value: DataType.GraphQL, key: DataType.GraphQL}]}
                readOnly={readOnly}
            />

        )
    }

Data.defaultProps = {
    index: '',
}


export {
    Data,
};
