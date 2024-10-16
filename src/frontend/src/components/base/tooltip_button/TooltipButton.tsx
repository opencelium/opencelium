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

import React, {FC} from 'react';
import {TooltipProps} from "reactstrap";
import {withTheme} from "styled-components";
import Tooltip from "../tooltip/Tooltip";
import {TooltipButtonProps} from "./interfaces";
import Button from "../button/Button";
import {ButtonProps} from "../button/interfaces";

const TooltipButton: FC<TooltipButtonProps & ButtonProps & Partial<TooltipProps>> =
    ({
         tooltip,
         position,
         target,
         component,
         ...buttonProps
     }) => {
        const id = target.toString().replace(new RegExp('\\W|^_*', 'g'), '_').substring(1);
        if (!tooltip) {
            return <Button id={id} {...buttonProps}/>;
        }
        return (
            <Tooltip target={id} tooltip={tooltip} position={position} component={
                <Button id={id} {...buttonProps}/>}
            />
        )
    }

TooltipButton.defaultProps = {
}


export {
    TooltipButton,
};

export default withTheme(TooltipButton);
