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