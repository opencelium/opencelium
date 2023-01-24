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

import {ITheme} from "@style/Theme";

interface ActionProps{
    id: string,
    label: string,
    onClick: any,
    isLoading?: boolean,
    isDisabled?: boolean,
}

interface DialogThemeProps{
    modal?: string,
    content?: string,
    wrapper?: string,
    title?: string,
    dialog?: string,
}

interface DialogStylesProps{
    modal?: object,
    header?: object,
    body?: object,
}

interface DialogProps{
    theme?: ITheme,
    active: boolean,
    title: string,
    isConfirmation?: boolean,
    actions: ActionProps[],
    toggle: any,
    dialogClassname?: string,
    dialogTheme?: DialogThemeProps,
    styles?: DialogStylesProps,
}

export {
    ActionProps,
    DialogProps,
}