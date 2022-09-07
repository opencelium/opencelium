/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import XmlEditor from "./xml_editor/XmlEditor";
import Input from "../Input";
import {InputXmlViewProps} from "./interfaces";
import {getReactXmlStyles} from "./styles";
import {EditButton} from "@app_component/base/input/json_view/EditButton";
import EditXmlButton from './EditXmlButton';
import CXmlEditor from "@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor";


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
        marginBottom: '50px',
        paddingLeft: hasIcon && isIconInside ? theme.input.iconInputDistance : '0',
        paddingRight: isLoadingWithoutIcon ? '30px' : 0,
        theme,
    }
    let xmlValue = CXmlEditor.createXmlEditor(xmlViewProps?.xml).convertToXml();
    if(xmlValue && xmlValue.length > 1){
        xmlValue = xmlValue.substring(1);
    }
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <XmlEditor
                style={getReactXmlStyles(styleProps)}
                {...xmlViewProps}
            />
            {hasEdit && <EditXmlButton readOnly={readOnly} xmlValue={xmlValue} editXml={(newXml) => xmlViewProps.afterUpdateCallback(newXml)}/>}
        </Input>
    );
}

InputXmlView.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
    hasEdit: false,
}

export default withTheme(InputXmlView);