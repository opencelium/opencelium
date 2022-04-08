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

import {ITheme} from "../../../general/Theme";
import {ElementProps, InputElementProps} from "../../../atoms/input/interfaces";
import {OptionProps} from "@atom/input/select/interfaces";

export enum PERMISSION_TYPES {
    CREATE= 'CREATE',
    READ= 'READ',
    UPDATE= 'UPDATE',
    DELETE= 'DELETE',
}

interface PermissionsStyledProps extends ElementProps{
    hasLabel?: boolean,
}

export interface ComponentProps{
    componentId: number,
    name: string,
    permissions: PERMISSION_TYPES[],
}

export interface PermissionProps{
    [key: string]: PERMISSION_TYPES[],
}

interface PermissionsProps extends InputElementProps, PermissionsStyledProps{
    theme?: ITheme,
    id?: string,
    permissions: PermissionProps,
    components: OptionProps[],
    onChange: any,
}


export {
    PermissionsProps,
    PermissionsStyledProps,
}