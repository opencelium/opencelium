import React, {FC} from 'react';
import Tooltip from "../../atoms/tooltip/Tooltip";
import Icon from "../../atoms/icon/Icon";
import {IconProps} from "@atom/icon/interfaces";
import {TooltipProps} from "reactstrap";
import {TooltipIconProps} from "./interfaces";
import {withTheme} from "styled-components";

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