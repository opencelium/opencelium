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
import {withTheme} from 'styled-components';
import {InputSwitchProps} from './interfaces';
import Input from "../Input";
import {InputSwitcherStyled, InputSwitchStyled} from "./styles";
import Text from "../../text/Text";
import {TextSize} from "../../text/interfaces";


const InputSwitch: FC<InputSwitchProps> = ({
       isChecked,
       placeholder,
       required,
       label,
       name,
       onClick,
       icon,
       color,
       error,
       isLoading,
       isIconInside,
       readOnly,
       ...props
    }) => {
    return (
        <Input readOnly={readOnly} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputSwitchStyled {...props}>
                <InputSwitcherStyled isChecked={isChecked} onClick={ readOnly ? () => {} : onClick}/>
                <Text value={name} size={TextSize.Size_14}/>
            </InputSwitchStyled>
        </Input>
    );
}

InputSwitch.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
    position: '',
}

export default withTheme(InputSwitch);