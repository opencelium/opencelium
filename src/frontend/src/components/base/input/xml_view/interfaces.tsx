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

import React from "react";
import {ITheme} from "@style/Theme";
import {InputElementProps} from "../../input/interfaces";
import CXmlEditor from "@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor";

interface EditXmlButtonProps{
    theme?: ITheme,
    editXml: (xml: any) => void,
    readOnly?: boolean,
    xmlValue: string,
}

interface InputXmlViewProps extends InputElementProps{
    theme?: ITheme,
    xmlViewProps:{
        translate: any,
        xml: any,
        afterUpdateCallback: (xmlEditor: CXmlEditor) => void,
        readOnly?: boolean,
    },
    hasEdit?: boolean,
}

export {
    EditXmlButtonProps,
    InputXmlViewProps,
}