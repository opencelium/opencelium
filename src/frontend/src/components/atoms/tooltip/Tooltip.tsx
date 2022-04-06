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

import React, {FC, useState} from 'react';

import {Tooltip as ReactstrapTooltip, TooltipProps} from 'reactstrap';

const Tooltip: FC<TooltipProps> =
    ({
        position,
        target,
        tooltip,
        component,
     }) => {
        const [tooltipOpen, setTooltipOpen] = useState(false);
        const toggle = () => setTooltipOpen(!tooltipOpen);
        return(
            <React.Fragment>
                {component}
                <ReactstrapTooltip autohide={false} placement={position} target={target} isOpen={tooltipOpen} toggle={toggle}>
                    {tooltip}
                </ReactstrapTooltip>
            </React.Fragment>
        )
}

Tooltip.defaultProps = {
    position: 'auto',
}

export default Tooltip;