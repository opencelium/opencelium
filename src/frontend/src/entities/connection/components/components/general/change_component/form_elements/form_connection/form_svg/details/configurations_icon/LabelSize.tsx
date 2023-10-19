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


import React, {FC} from "react";
import {useAppDispatch} from "@application/utils/store";
import InputSelect from "@app_component/base/input/select/InputSelect";
import { OptionProps } from "@app_component/base/input/select/interfaces";
import { Connection } from "@entity/connection/classes/Connection";
import {setPanelConfigurations} from "@root/redux_toolkit/slices/ConnectionSlice";
import {setModalPanelConfigurations} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

const options: OptionProps[] = [];
for(let i = 0; i < 10; i++){
    options.push({label: `${10 + i * 2}`, value: 10 + i * 2});
}

const LabelSize: FC<{isModal?: boolean, value: number, onChange: (value: number) => void}> = ({isModal, value, onChange}) => {
    return (
        <InputSelect
            id={`input_label_size`}
            icon={'format_size'}
            label={'Label Size'}
            marginTop={'50px'}
            options={options}
            onChange={(option: any) => onChange(option.value)}
            value={options.find(o => o.value === value)}
        />
    )
}

export default GetModalProp()(LabelSize);
