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

import React from "react";
import {ITheme} from "@style/Theme";

interface CalloutStyledProps{
    hasFoot?: boolean,
    theme?: ITheme,
}
interface CalloutMessageStyledProps{
    hasFoot?: boolean,
    theme?: ITheme,
}
interface CalloutProps extends CalloutStyledProps{
    message: string,
    hasFoot?: boolean,
    icon?: React.ReactNode,
    theme?: ITheme,
}

interface TopBarProps{
    theme?: ITheme,
}

interface NotificationItemProps{
    theme?: ITheme,
}

interface SearchProps{
    theme?: ITheme,
}

export {
    CalloutStyledProps,
    CalloutMessageStyledProps,
    CalloutProps,
    TopBarProps,
    NotificationItemProps,
    SearchProps,
}