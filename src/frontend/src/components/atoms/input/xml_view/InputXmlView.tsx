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
import Input from "../Input";
import {InputXmlViewProps} from "@atom/input/xml_view/interfaces";
import {getReactXmlStyles} from "@atom/input/xml_view/styles";
import XmlEditor from "@basic_components/xml_editor/XmlEditor";


const InputXmlView: FC<InputXmlViewProps> = ({
        xmlViewProps,
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
        ...props
    }) => {
    const hasLabel = label !== '';
    const hasIcon = !!icon;
    const isLoadingWithoutIcon = !hasIcon && isLoading;
    const styleProps = {
        hasIcon,
        isIconInside,
        marginTop: hasLabel ? '25px' : 0,
        marginBottom: '50px',
        paddingLeft: hasIcon && isIconInside ? theme.input.iconInputDistance : '0',
        paddingRight: isLoadingWithoutIcon ? '30px' : 0,
        theme,
    }
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <XmlEditor
                style={getReactXmlStyles(styleProps)}
                {...xmlViewProps}
            />
        </Input>
    );
}

InputXmlView.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
}

export default withTheme(InputXmlView);