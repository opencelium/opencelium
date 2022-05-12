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

import {ReactJsonViewProps} from "react-json-view";
import {ITheme} from "@style/Theme";
import {InputElementProps} from "../../input/interfaces";

interface InputJsonViewProps extends InputElementProps{
    theme?: ITheme,
    jsonViewProps: ReactJsonViewProps,
    updateJson: (body: any) => void,
    hasEdit?: boolean,
}

interface EditButtonProps{
    theme?: ITheme,
    editJson: (body: any) => void,
    readOnly?: boolean,
    jsonValue: any,
}

export {
    InputJsonViewProps,
    EditButtonProps,
}