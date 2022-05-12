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
import ReactJson, {InteractionProps} from "react-json-view";
import Input from "../Input";
import {InputJsonViewProps} from "../../input/json_view/interfaces";
import {getReactJsonStyles} from "../../input/json_view/styles";
import {EditButton} from "../../input/json_view/EditButton";


const InputJsonView: FC<InputJsonViewProps> = ({
        jsonViewProps,
        value,
        placeholder,
        required,
        label,
        icon,
        error,
        isLoading,
        isIconInside,
        readOnly,
        theme,
        updateJson,
        hasEdit,
        ...props
    }) => {
    const hasLabel = label !== '';
    const hasIcon = !!icon;
    const isLoadingWithoutIcon = !hasIcon && isLoading;
    const styleProps = {
        hasIcon,
        isIconInside,
        marginTop: hasLabel ? '25px' : 0,
        marginBottom: jsonViewProps?.style?.marginBottom || '50px',
        paddingLeft: hasIcon && isIconInside ? theme.input.iconInputDistance : '0',
        paddingRight: isLoadingWithoutIcon ? '30px' : 0,
        theme,
    }
    const style = getReactJsonStyles(styleProps);
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <ReactJson
                {...jsonViewProps}
                style={style}
                onEdit = {readOnly ? false : (value: InteractionProps) => {
                    updateJson(value.updated_src)
                }}
                onDelete={readOnly ? false : (value: InteractionProps) => {
                    updateJson(value.updated_src)
                }}
                onAdd={readOnly ? false : (value: InteractionProps) => {
                    updateJson(value.updated_src)
                }}
            />
            {hasEdit && <EditButton readOnly={readOnly} jsonValue={jsonViewProps.src} editJson={updateJson}/>}
        </Input>
    );
}

InputJsonView.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
    hasEdit: true,
}

export default withTheme(InputJsonView);