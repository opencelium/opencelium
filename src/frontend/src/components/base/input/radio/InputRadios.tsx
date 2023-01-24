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
import {withTheme} from 'styled-components';
import {InputRadiosProps, RadiosAlign} from './interfaces';
import {InputRadio} from "./InputRadio";
import Input from "../Input";
import {InputRadiosStyled} from "./styles";


const InputRadios: FC<InputRadiosProps> = ({
        autoFocus,
        options,
        value,
        placeholder,
        required,
        label,
        onChange,
        icon,
        color,
        error,
        isLoading,
        isIconInside,
        readOnly,
        align,
        ...props
    }) => {
    const hasOptions = options && options.length > 0;
    if(!hasOptions){
        return null;
    }
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <InputRadiosStyled readOnly={readOnly} {...props}>
                {
                    options.map((option, key) =>
                        <InputRadio align={align} autoFocus={option.autoFocus} key={option.key} id={`radio_input_${option.label.toString().toLowerCase()}`} readOnly={readOnly} {...option} onChange={readOnly ? () => {} : onChange} currentValue={value}/>
                    )
                }
            </InputRadiosStyled>
        </Input>
    );
}

InputRadios.defaultProps = {
    align: RadiosAlign.Vertical,
    label: '',
    error: '',
    required: false,
    isLoading: false,
}

export default withTheme(InputRadios);