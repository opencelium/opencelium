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

import {Operation} from "@class/invoker/Operation";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {ResponseFormat} from "@interface/invoker/IBody";
import {ITheme} from "../../general/Theme";

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
    value: any,
    format: ResponseFormat,
}

interface HeaderProps{
    theme?: ITheme,
    updateHeader: (header: any) => void,
    readOnly?: boolean,
    value: any,
}

export {
    NameProps,
    EndpointProps,
    StatusProps,
    DataProps,
    BodyProps,
    HeaderProps,
}