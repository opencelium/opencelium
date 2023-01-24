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

import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {ITheme} from "@style/Theme";
import {Operation} from "../../classes/Operation";
import {ResponseFormat} from "../../requests/models/Body";
import {InputElementProps} from "@app_component/base/input/interfaces";
import CXmlEditor from "@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor";
import {AceEditorProps} from "react-ace/types";

interface DefaultProps{
    operationItem: Operation,
    updateOperation: (operation: Operation) => void,
}

interface NameProps extends DefaultProps, InputTextProps{

}

interface EndpointProps extends DefaultProps, InputTextProps{

}

interface StatusProps extends DefaultProps, InputTextProps{

}

interface DataProps extends DefaultProps, InputRadiosProps{

}


interface BodyProps{
    theme?: ITheme,
    updateBody: (body: any) => void,
    readOnly?: boolean,
    value: string,
    format: ResponseFormat,
    error?: string,
}

interface HeaderProps{
    theme?: ITheme,
    updateHeader: (header: any) => void,
    readOnly?: boolean,
    value: any,
}

interface JsonBodyProps extends InputElementProps{
    theme?: ITheme,
    jsonProps: AceEditorProps,
}
interface XmlBodyProps extends InputElementProps{
    theme?: ITheme,
    xmlProps: AceEditorProps,
}

export {
    NameProps,
    EndpointProps,
    StatusProps,
    DataProps,
    BodyProps,
    HeaderProps,
    JsonBodyProps,
    XmlBodyProps,
}