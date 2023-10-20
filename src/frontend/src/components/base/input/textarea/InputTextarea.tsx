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
import { InputTextareaProps } from './interfaces';
import {TextareaStyled} from "./styles";
import Input from "../Input";
import {InputTextType} from "../text/interfaces";


const InputTextarea: FC<InputTextareaProps> =
    ({
        maxLength,
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
        rows,
        readOnly,
        height,
        ...props
     }) => {
        const hasLabel = label !== '';
        let minHeight = 24 * rows + 40;
        if(hasLabel){
            minHeight += 20;
        }
        return (
            <Input isTextarea readOnly={readOnly} value={value} maxLength={maxLength} placeholder={placeholder} required={required}
                   label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside} minHeight={minHeight} height={height}>
                <TextareaStyled
                    isTextarea
                    emphasizeColor={color}
                    maxLength={maxLength}
                    value={value}
                    onChange={onChange}
                    rows={rows}
                    readOnly={readOnly}
                    {...props}
                />
            </Input>
        );
    };

InputTextarea.defaultProps = {
    rows: 3,
    maxLength: Infinity,
    type: InputTextType.Text,
    placeholder: '',
    label: '',
    error: '',
    required: false,
    readOnly: false,
    hasUnderline: true,
}

export default InputTextarea;
