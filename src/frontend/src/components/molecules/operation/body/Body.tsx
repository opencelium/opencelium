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
import {BodyProps} from "@molecule/operation/interfaces";
import InputJsonView from "@atom/input/json_view/InputJsonView";
import {useTranslation} from "react-i18next";
import InputXmlView from "@atom/input/xml_view/InputXmlView";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";
import {ResponseFormat} from "@model/invoker/Body";


const Body: FC<BodyProps> =
    ({
        updateBody,
        readOnly,
        value,
        format,
        ...props
    }) => {
        const {t} = useTranslation('basic_components');
        switch (format){
            case ResponseFormat.Json:
                return (
                    <InputJsonView
                        readOnly={readOnly}
                        icon={'data_object'}
                        label={'Body'}
                        updateJson={updateBody}
                        jsonViewProps={{
                            name: 'body',
                            collapsed: false,
                            src: value,
                        }}
                    />
                );
            case ResponseFormat.Xml:
                return(
                    <InputXmlView
                        readOnly={readOnly}
                        icon={'data_object'}
                        label={'Body'}
                        xmlViewProps={{
                            translate: t,
                            xml: value,
                            afterUpdateCallback: (xmlEditor: CXmlEditor) => {return updateBody(xmlEditor.convertToBackendXml())},
                            readOnly: readOnly,
                        }}
                    />
                );
        }
        return null;
    }

Body.defaultProps = {
}


export {
    Body,
};
