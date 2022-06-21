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
import {withTheme} from "styled-components";
import {TooltipProps} from "reactstrap";
import Tooltip from "../tooltip/Tooltip";
import Icon from "../icon/Icon";
import {IconProps} from "../icon/interfaces";
import {TooltipIconProps} from "./interfaces";

const TooltipIcon: FC<TooltipIconProps & IconProps & Partial<TooltipProps>> =
    ({
        tooltip,
        position,
        target,
        component,
        ...iconProps
    }) => {
    return (
        <Tooltip target={target} tooltip={tooltip} position={position} component={<Icon id={target.toString()} {...iconProps}/>}/>
    )
}

TooltipIcon.defaultProps = {
}


export {
    TooltipIcon,
};

export default withTheme(TooltipIcon);