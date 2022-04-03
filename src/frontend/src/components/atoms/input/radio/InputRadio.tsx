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
import {RadioStyled} from './styles';
import {InputRadioProps, RadiosAlign} from "./interfaces";
import Text from "@atom/text/Text";

const InputRadio: FC<InputRadioProps> =
    ({
        align,
        autoFocus,
        id,
        label,
        checked,
        value,
        onChange,
        color,
        marginLeft,
        currentValue,
        readOnly,
    }) => {
    const inputComponent = <input autoFocus={autoFocus} id={id} readOnly={readOnly} type={'radio'} value={value} checked={value === currentValue} onChange={onChange}/>;
    const inputBeforeLabel = align === RadiosAlign.Horizontal ? inputComponent : null ;
    const inputAfterLabel = align === RadiosAlign.Vertical ? inputComponent : null;
    return (
        <RadioStyled align={align} emphasizeColor={color} marginLeft={marginLeft}>
            {inputBeforeLabel}
            <Text value={label}/>
            {inputAfterLabel}
        </RadioStyled>
    )
}

InputRadio.defaultProps = {
    align: RadiosAlign.Vertical,
}


export {
    InputRadio,
};

export default withTheme(InputRadio);